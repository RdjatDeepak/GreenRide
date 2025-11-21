package com.greenride.greenride_backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // IMPORTANT: Define the base URL of your frontend application
    private final String FRONTEND_BASE_URL = "http://localhost:5173";
    // This should be the deployed URL (e.g., https://www.greenridetogether.com) in production.

    // Define the custom display name for the sender
    private final String CUSTOM_FROM_EMAIL = "deepakkhokhar0143@gmail.com"; // Use the authenticated email
    private final String CUSTOM_FROM_NAME = "GreenRide Team"; // <-- The name you want users to see

    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            // 1. Create a MimeMessage
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8"); // true enables multipart/HTML

            // 2. Set the 'From' address with the display name
            // The first argument must be the authenticated username,
            // the second is the display name that will show in the inbox.
            helper.setFrom(CUSTOM_FROM_EMAIL, CUSTOM_FROM_NAME);

            helper.setTo(toEmail);
            helper.setSubject("GreenRide: Password Reset Request");

            String resetLink = FRONTEND_BASE_URL + "/reset-password?token=" + token;

            // 3. Use HTML for better formatting (optional but recommended)
            String emailContent = String.format(
                    "<html><body>" +
                            "<p>Hello,</p>" +
                            "<p>A password reset was requested for your **GreenRide** account.</p>" +
                            "<p>Click the link below to set a new password. This link will expire in 24 hours.</p>" +
                            "<p><a href=\"%s\">Reset Your Password</a></p>" +
                            "<p>If you did not request a password reset, please ignore this email.</p>" +
                            "<p>Thank you,<br/>The GreenRide Team</p>" +
                            "</body></html>",
                    resetLink
            );

            // 4. Set the content and specify it as HTML (true)
            helper.setText(emailContent, true);

            // 5. Send the MimeMessage
            mailSender.send(mimeMessage);

            System.out.println("Email Sent Successfully with display name: " + CUSTOM_FROM_NAME);

        } catch (Exception e) {
            System.err.println("Failed to send email. Error: " + e.getMessage());
        }
    }



    //-----------------------------------------------------------------------
//
//    /**
//     * Sends the password reset email to the user.
//     * @param toEmail The recipient's email address.
//     * @param token The unique password reset token.
//     */
//    public void sendPasswordResetEmail(String toEmail, String token) {
//        SimpleMailMessage message = new SimpleMailMessage();
//
//        // Sender email is set by spring.mail.username in application.properties
//        message.setFrom("greenride@noreply.com");
//        message.setTo(toEmail);
//        message.setSubject("GreenRide: Password Reset Request");
//
//        // Construct the full reset link that the user will click
//        String resetLink = FRONTEND_BASE_URL + "/reset-password?token=" + token;
//
//        String emailContent = String.format(
//                "Hello,\n\n" +
//                        "A password reset was requested for your GreenRide account. " +
//                        "Click the link below to set a new password. This link will expire in 24 hours.\n\n" +
//                        "%s\n\n" +
//                        "If you did not request a password reset, please ignore this email.\n\n" +
//                        "Thank you,\n" +
//                        "The GreenRide Team",
//                resetLink
//        );
//
//        message.setText(emailContent);
//
//        try {
//            mailSender.send(message);
//            System.out.println("Email Sent Successfully to: " + toEmail);
//        } catch (Exception e) {
//            System.err.println("Failed to send email to " + toEmail + ". Error: " + e.getMessage());
//            // In a real app, you might log this error more formally
//        }
//    }

}