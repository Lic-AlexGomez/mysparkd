package com.social.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @PostMapping("/{userId}/unmatch")
    public ResponseEntity<Void> unmatch(@PathVariable UUID userId) {
        matchService.unmatch(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/block")
    public ResponseEntity<Void> block(@PathVariable UUID userId) {
        matchService.block(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/matches/{userId}/unblock")
    public ResponseEntity<Void> unblock(@PathVariable UUID userId) {
        matchService.unblock(userId);
        return ResponseEntity.ok().build();
    }
}
