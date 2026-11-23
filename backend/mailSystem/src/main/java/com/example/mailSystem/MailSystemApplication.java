package com.example.mailSystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MailSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(MailSystemApplication.class, args);
	}

}
