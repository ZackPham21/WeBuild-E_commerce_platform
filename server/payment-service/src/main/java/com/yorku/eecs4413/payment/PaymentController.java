package com.yorku.eecs4413.payment;


import com.yorku.eecs4413.payment.ProcessPaymentRequest;
import com.yorku.eecs4413.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody ProcessPaymentRequest req) {
        Map<String, Object> result = paymentService.processPayment(req);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/receipt/{itemId}")
    public ResponseEntity<Map<String, Object>> getReceipt(@PathVariable Long itemId) {
        Map<String, Object> result = paymentService.getReceipt(itemId);
        return result.containsKey("error")
                ? ResponseEntity.status(404).body(result)
                : ResponseEntity.ok(result);
    }
}
