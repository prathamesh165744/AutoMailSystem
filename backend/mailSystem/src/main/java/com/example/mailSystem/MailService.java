package com.example.mailSystem;

import jakarta.mail.internet.MimeMessage;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

@Service
public class MailService {

    private static final Pattern EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Autowired
    private JavaMailSender sender;

    @Value("${spring.mail.username:}")
    private String from;

    @Value("${spring.mail.password:}")
    private String password;

    // ---- live status, read by /api/status ----
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean stopRequested = new AtomicBoolean(false);
    private final AtomicInteger total = new AtomicInteger();
    private final AtomicInteger sent = new AtomicInteger();
    private final AtomicInteger failed = new AtomicInteger();
    private final List<String> log = new CopyOnWriteArrayList<>();

    public record Status(boolean running, int total, int sent, int failed, List<String> log) {}

    public Status status() {
        return new Status(running.get(), total.get(), sent.get(), failed.get(), new ArrayList<>(log));
    }

    public boolean isConfigured() {
        return from != null && !from.isBlank() && password != null && !password.isBlank();
    }

    public boolean isRunning() {
        return running.get();
    }

    public void stop() {
        stopRequested.set(true);
    }

    /**
     * Reads the Excel file. For every row it takes the first cell that looks like an email
     * as the email, and the first other non-empty text cell as the company name.
     * So the header row is skipped automatically, and duplicates / bad emails are removed.
     */
    public List<String[]> readExcel(byte[] bytes) throws Exception {
        Map<String, String[]> unique = new LinkedHashMap<>();
        DataFormatter fmt = new DataFormatter();

        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                String email = null;
                String company = null;
                for (Cell cell : row) {
                    String value = fmt.formatCellValue(cell).trim();
                    if (value.isEmpty()) continue;
                    if (email == null && EMAIL.matcher(value).matches()) {
                        email = value.toLowerCase();
                    } else if (company == null && !EMAIL.matcher(value).matches()) {
                        company = value;
                    }
                }
                if (email != null && !unique.containsKey(email)) {
                    unique.put(email, new String[]{email, company == null ? "Team" : company});
                }
            }
        }
        return new ArrayList<>(unique.values());
    }

    /** Runs in a background thread so the website does not hang while mails are being sent. */
    @Async
    public void sendAll(List<String[]> rows, String subject, String body,
                        byte[] resume, String resumeName, int delaySec) {
        running.set(true);
        stopRequested.set(false);
        total.set(rows.size());
        sent.set(0);
        failed.set(0);
        log.clear();
        log.add("Started: " + rows.size() + " mails, " + delaySec + " sec gap");

        for (int i = 0; i < rows.size(); i++) {
            if (stopRequested.get()) {
                log.add("STOPPED by user");
                break;
            }
            String[] r = rows.get(i);
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, resume != null);
                helper.setFrom(from);
                helper.setTo(r[0]);
                helper.setSubject(subject.replace("{company}", r[1]));
                helper.setText(body.replace("{company}", r[1]));
                if (resume != null) {
                    helper.addAttachment(resumeName, new ByteArrayResource(resume));
                }
                sender.send(message);
                sent.incrementAndGet();
                log.add("SENT    " + r[0] + "  (" + r[1] + ")");
            } catch (Exception e) {
                failed.incrementAndGet();
                log.add("FAILED  " + r[0] + "  - " + e.getMessage());
            }

            if (i < rows.size() - 1) {
                try {
                    Thread.sleep(delaySec * 1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.add("INTERRUPTED");
                    break;
                }
            }
        }
        log.add("DONE  sent=" + sent.get() + " failed=" + failed.get());
        running.set(false);
    }
}
