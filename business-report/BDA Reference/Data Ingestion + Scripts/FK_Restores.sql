USE HiddenGemMusic;
GO

ALTER TABLE PeakReachBySong
    ADD CONSTRAINT FK_PeakReachBySong_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE TrendVelocityBySong
    ADD CONSTRAINT FK_TrendVelocity_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE HiddenGems
    ADD CONSTRAINT FK_HiddenGems_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE SongCountryPresence
    ADD CONSTRAINT FK_SongCountryPresence_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE DiscoveryGapByDay
    ADD CONSTRAINT FK_DiscoveryGap_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
GO