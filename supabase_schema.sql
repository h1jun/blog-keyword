-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Keywords 테이블
CREATE TABLE keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(20) CHECK (competition_level IN ('낮음', '중간', '높음')),
    cpc INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    platform VARCHAR(20) CHECK (platform IN ('google', 'naver', 'youtube', 'integrated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Longtail Keywords 테이블
CREATE TABLE longtail_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_keyword VARCHAR(100) NOT NULL,
    longtail_keyword VARCHAR(200) UNIQUE NOT NULL,
    source VARCHAR(50) CHECK (source IN ('autocomplete', 'related', 'pattern')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_keywords_score ON keywords(score DESC);
CREATE INDEX idx_keywords_platform ON keywords(platform);
CREATE INDEX idx_keywords_created ON keywords(created_at DESC);
CREATE INDEX idx_longtail_parent ON longtail_keywords(parent_keyword);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger 생성
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();