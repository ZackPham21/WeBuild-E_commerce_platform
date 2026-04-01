package com.yorku.eecs4413.gateway;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.google.gson.Gson;

import jakarta.annotation.PostConstruct;

@Service
public class GatewayChatbotService {

    private Client client;
    private final Gson gson = new Gson();
    @Autowired
    private RestTemplate restTemplate;
    @Value("${service.catalogue.url}")
    private String catalogueUrl;
    // ─── Initializer ──────────────────────────────────────────────
    @PostConstruct
    public void init() {
        //This apiKey is currently under a free account and has a rate limit of 500 requests/day and 15 requests/minutes.
        //If the chatbot stops replying, please create a new Gemini account and insert your own key.
    	client = Client.builder().apiKey("AIzaSyD59C54sD_A_RxRr_vntNUCT_7icJj0ctg").build();
    }

    // ─── Prompt ───────────────────────────────────────────────────
    public ResponseEntity<?> prompt(Map<String, Object> body) {
        try {
            // ── Build the prompt string ────────────────────────────
            String userInput = body.getOrDefault("prompt", "").toString();
            String itemData;
            try {
                ResponseEntity<?> itemsResponse= restTemplate.getForEntity(catalogueUrl + "/api/catalogue/items", Object.class);
                itemData = itemsResponse.getBody() != null
                        ? gson.toJson(itemsResponse.getBody())
                        : "no data";
            } catch (Exception e) {
                itemData = "no data";
            }
            String prompt = 
            		"""
            		[SYSTEM PROMPT: You are a friendly sales representative who answers questions regarding auction service.  
            		You are given the following information on items and current auctions: 
            		""" 
            		+ itemData +
            		""" 
            		Answer questions based on the given information; do not rely on your own code base.
            		Answer the questin in a human readable format.
            		If a question could not be answered due to either violating TOS or a lack of information, simply answer with Sorry, I can not answer this question. 
            		You MUST return your response strictly as a valid JSON object. 
            		Do not include any explanation, markdown, or text outside the JSON.]                  
            		User input: 
            		""" + userInput;


            // ── Submit to Gemini API ───────────────────────────────
            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3.1-flash-lite-preview",
                    prompt,
                    null
            );

            String rawText = response.text();

            // Step 1: Strip markdown code fences if present
            rawText = rawText
                 .replaceAll("(?s)```json\\s*", "")
                 .replaceAll("(?s)```\\s*", "")
                 .trim();
         if (!rawText.startsWith("{")) {
             rawText = gson.toJson(Map.of("response", rawText));
         }
            Map<String, Object> jsonResponse = gson.fromJson(rawText, Map.class);

            return ResponseEntity.ok(jsonResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", e.getMessage())
            );
        }
    }
}
