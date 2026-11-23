package com.example.mailSystem;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class MailController {

    private static final int MIN_DELAY_SEC = 10;   // protects your Gmail from being blocked
    private static final int MAX_PER_RUN = 400;    // Gmail free limit is about 500/day

    @Autowired
    private MailService service;

    @PostMapping("/send")
    public ResponseEntity<String> send(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "resume", required = false) MultipartFile resume,
            @RequestParam("subject") String subject,
            @RequestParam("body") String body,
            @RequestParam(value = "delaySec", defaultValue = "30") int delaySec,
            @RequestParam(value = "skip", defaultValue = "0") int skip,
            @RequestParam(value = "limit", defaultValue = "50") int limit) throws Exception {

        if (!service.isConfigured()) {
            return ResponseEntity.badRequest().body(
                    "Gmail is not configured. Set MAIL_USER and MAIL_PASS environment variables and restart the backend.");
        }
        if (service.isRunning()) {
            return ResponseEntity.badRequest().body("A sending job is already running. Wait or press Stop.");
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload the Excel file.");
        }
        if (subject.isBlank() || body.isBlank()) {
            return ResponseEntity.badRequest().body("Subject and message cannot be empty.");
        }

        List<String[]> all;
        try {
            all = service.readExcel(file.getBytes());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not read the Excel file: " + e.getMessage());
        }
        if (all.isEmpty()) {
            return ResponseEntity.badRequest().body("No valid email addresses found in the file.");
        }

        int from = Math.max(0, skip);
        int count = Math.min(Math.max(1, limit), MAX_PER_RUN);
        if (from >= all.size()) {
            return ResponseEntity.badRequest().body(
                    "Skip (" + from + ") is more than the number of emails (" + all.size() + ").");
        }
        List<String[]> batch = all.subList(from, Math.min(all.size(), from + count));

        byte[] resumeBytes = (resume != null && !resume.isEmpty()) ? resume.getBytes() : null;
        String resumeName = resumeBytes != null ? resume.getOriginalFilename() : null;

        service.sendAll(batch, subject, body, resumeBytes, resumeName, Math.max(MIN_DELAY_SEC, delaySec));

        int left = all.size() - (from + batch.size());
        return ResponseEntity.ok("Started: sending " + batch.size() + " mails (" + all.size()
                + " valid emails in file, " + left + " left for next time).");
    }

    @GetMapping("/status")
    public MailService.Status status() {
        return service.status();
    }

    @PostMapping("/stop")
    public String stop() {
        service.stop();
        return "Stop requested";
    }
}
