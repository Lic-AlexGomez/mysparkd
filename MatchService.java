package com.social.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final BlockRepository blockRepository;

    public void unmatch(UUID userId) {
        // Lógica para eliminar el match
        matchRepository.deleteByUserId(userId);
    }

    public void block(UUID userId) {
        // Lógica para bloquear usuario
        blockRepository.blockUser(userId);
    }

    public void unblock(UUID userId) {
        // Lógica para desbloquear usuario
        blockRepository.unblockUser(userId);
    }
}
