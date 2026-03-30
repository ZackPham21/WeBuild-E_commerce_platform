package com.yorku.eecs4413.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    public Map<String, Object> processPayment(ProcessPaymentRequest req) {
        // 1. Winner eligibility check
        if (!req.getUserId().equals(req.getWinnerId())) {
            return Map.of("success", false,
                    "message", "Payment failed. Only the winning bidder can complete payment for this item.");
        }

        // 2. Prevent duplicate payment
        if (paymentRepository.existsByItemId(req.getItemId())) {
            return Map.of("success", false, "message", "Payment already processed for this item.");
        }

        // 3. Validate card fields
        String cardError = validateCard(
                req.getCardNumber(),
                req.getCardHolderName(),
                req.getExpirationDate(),
                req.getSecurityCode()
        );
        if (cardError != null) {
            return Map.of("success", false, "message", cardError);
        }

        // 4. Compute total
        BigDecimal total = req.getWinningBid().add(req.getShippingCost());
        if (req.isExpedited() && req.getExpeditedCost() != null) {
            total = total.add(req.getExpeditedCost());
        }

        // 5. Save payment record (mask last 4 digits of card)
        String digits = req.getCardNumber().replaceAll("[\\s-]", "");
        String masked = "****-****-****-" + digits.substring(digits.length() - 4);

        Payment payment = new Payment();
        payment.setItemId(req.getItemId());
        payment.setWinnerId(req.getUserId());
        payment.setWinnerUsername(req.getUsername());
        payment.setWinningBid(req.getWinningBid());
        payment.setShippingCost(req.getShippingCost());
        payment.setExpedited(req.isExpedited());
        payment.setExpeditedCost(req.isExpedited() ? req.getExpeditedCost() : BigDecimal.ZERO);
        payment.setTotalAmount(total);
        payment.setMaskedCardNumber(masked);
        payment.setCardHolderName(req.getCardHolderName());
        payment.setExpirationDate(req.getExpirationDate());
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment.setProcessedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        return Map.of(
                "success", true,
                "message", "Payment processed successfully.",
                "totalAmount", total,
                "maskedCard", payment.getMaskedCardNumber(),
                "paymentId", payment.getId()
        );
    }

    public Map<String, Object> getReceipt(Long itemId) {
        Optional<Payment> optPayment = paymentRepository.findByItemId(itemId);
        if (optPayment.isEmpty()) {
            return Map.of("error", "No payment found for item " + itemId);
        }

        Payment p = optPayment.get();
        return Map.of(
                "receiptId", p.getId(),
                "itemId", p.getItemId(),
                "winnerUsername", p.getWinnerUsername(),
                "winningBid", p.getWinningBid(),
                "shippingCost", p.getShippingCost(),
                "expedited", p.isExpedited(),
                "totalAmount", p.getTotalAmount(),
                "maskedCardNumber", p.getMaskedCardNumber(),
                "processedAt", p.getProcessedAt().toString()
        );
    }

    // ── Card Validation ───────────────────────────────────────────────────
    // Rules:
    //   - Card number: strip spaces/dashes, must be at least 12 digits (no Luhn check)
    //   - Card holder: must not be blank
    //   - Expiry: MM/YY or MM/YYYY format, must not be in the past
    //   - Security code: 3 or 4 digits
    // Returns null if valid, or an error message string if invalid.

    private String validateCard(String cardNumber, String cardHolderName,
                                String expirationDate, String securityCode) {

        // Card number — strip spaces and dashes, require at least 12 digits
        if (cardNumber == null) {
            return "Card number is required.";
        }
        String digits = cardNumber.replaceAll("[\\s-]", "");
        if (!digits.matches("\\d{12,}")) {
            return "Card number must be at least 12 digits.";
        }

        // Card holder name — must not be blank
        if (cardHolderName == null || cardHolderName.trim().isEmpty()) {
            return "Card holder name is required.";
        }

        // Expiration date — accepts MM/YY or MM/YYYY, must not be in the past
        if (expirationDate == null || !expirationDate.matches("(0[1-9]|1[0-2])/\\d{2,4}")) {
            return "Expiration date must be in MM/YY or MM/YYYY format.";
        }
        try {
            String[] parts = expirationDate.split("/");
            int month = Integer.parseInt(parts[0]);
            int year  = Integer.parseInt(parts[1]);
            if (year < 100) year += 2000; // convert 2-digit YY to full YYYY

            java.time.YearMonth expiry = java.time.YearMonth.of(year, month);
            java.time.YearMonth now    = java.time.YearMonth.now();
            if (expiry.isBefore(now)) {
                return "Card has expired.";
            }
        } catch (Exception e) {
            return "Invalid expiration date.";
        }

        // Security code — must be 3 or 4 digits
        if (securityCode == null || !securityCode.matches("\\d{3,4}")) {
            return "Security code must be 3 or 4 digits.";
        }

        return null; // all checks passed
    }
}