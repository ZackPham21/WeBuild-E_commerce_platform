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
        if (!isValidCardNumber(req.getCardNumber())) {
            return Map.of("success", false, "message", "Invalid card number.");
        }
        if (req.getCardHolderName() == null || req.getCardHolderName().isBlank()) {
            return Map.of("success", false, "message", "Card holder name is required.");
        }
        if (!isValidExpiry(req.getExpirationDate())) {
            return Map.of("success", false, "message", "Invalid or expired card expiration date.");
        }
        if (req.getSecurityCode() == null || !req.getSecurityCode().matches("\\d{3,4}")) {
            return Map.of("success", false, "message", "Invalid security code.");
        }

        // 4. Compute total
        BigDecimal total = req.getWinningBid().add(req.getShippingCost());
        if (req.isExpedited() && req.getExpeditedCost() != null) {
            total = total.add(req.getExpeditedCost());
        }

        // 5. Save payment record
        Payment payment = new Payment();
        payment.setItemId(req.getItemId());
        payment.setWinnerId(req.getUserId());
        payment.setWinnerUsername(req.getUsername());
        payment.setWinningBid(req.getWinningBid());
        payment.setShippingCost(req.getShippingCost());
        payment.setExpedited(req.isExpedited());
        payment.setExpeditedCost(req.isExpedited() ? req.getExpeditedCost() : BigDecimal.ZERO);
        payment.setTotalAmount(total);
        payment.setMaskedCardNumber("****-****-****-" + req.getCardNumber().substring(req.getCardNumber().length() - 4));
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

    // Basic Luhn check
    private boolean isValidCardNumber(String cardNumber) {
        if (cardNumber == null) return false;
        String cleaned = cardNumber.replaceAll("[\\s-]", "");
        if (!cleaned.matches("\\d{13,19}")) return false;

        int sum = 0;
        boolean alternate = false;
        for (int i = cleaned.length() - 1; i >= 0; i--) {
            int n = cleaned.charAt(i) - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }

    private boolean isValidExpiry(String expiry) {
        if (expiry == null || !expiry.matches("\\d{2}/\\d{2}")) return false;
        String[] parts = expiry.split("/");
        int month = Integer.parseInt(parts[0]);
        int year = 2000 + Integer.parseInt(parts[1]);
        if (month < 1 || month > 12) return false;
        LocalDateTime now = LocalDateTime.now();
        return year > now.getYear() || (year == now.getYear() && month >= now.getMonthValue());
    }
}