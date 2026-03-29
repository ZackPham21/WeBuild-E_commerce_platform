package com.yorku.eecs4413.gateway;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.*;
import com.google.gson.Gson;
import com.google.genai.JsonSerializable;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
    	client = Client.builder().apiKey("AIzaSyBsUCshZpHornpZYT4zo2p2ontEkOBp9mQ").build();
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
            		Attempt to answer questions based on the given information; do not rely on your own code base.
            		If a question could not be answered due to either violating TOS or a lack of information, simply answer with Sorry, I can not answer this question. 
            		You MUST return your response strictly as a valid JSON object. 
            		Do not include any explanation, markdown, or text outside the JSON.]                  
            		User input: 
            		""" + userInput;


            // ── Submit to Gemini API ───────────────────────────────
            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3.1-flash-lite",
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