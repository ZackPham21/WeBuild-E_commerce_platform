package com.yorku.eecs4413.gateway.config;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class GatewayLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(GatewayLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        String method = exchange.getRequest().getMethod() != null
                ? exchange.getRequest().getMethod().name()
                : "UNKNOWN";
        String path = exchange.getRequest().getURI().getRawPath();

        log.info("[GW:{}] --> {} {}", requestId, method, path);

        return chain.filter(exchange)
                .doOnSuccess(v -> {
                    Integer status = exchange.getResponse().getStatusCode() != null
                            ? exchange.getResponse().getStatusCode().value()
                            : null;
                    long tookMs = System.currentTimeMillis() - start;
                    log.info("[GW:{}] <-- {} {} status={} took={}ms", requestId, method, path, status, tookMs);
                })
                .doOnError(err -> {
                    long tookMs = System.currentTimeMillis() - start;
                    log.warn("[GW:{}] !! {} {} error={} took={}ms", requestId, method, path, err.getClass().getSimpleName(), tookMs);
                });
    }

    @Override
    public int getOrder() {
        return -1;
    }
}