import fs from 'fs';
import path from 'path';

const CATEGORIES_DIR = path.join(__dirname, 'categories');
const OUTPUT_FILE = path.join(__dirname, '../../src/words.json');

// Weights for specific categories to influence difficulty
const CATEGORY_WEIGHTS: Record<string, number> = {
    'everyday': 0,
    'animals': 0,
    'food': 0,
    'body': 0,
    'clothing': 0,
    'tools': 0,
    'transport': 0,
    'places': 0,
    'nature': 1,
    'sports': 1,
    'actions': 2,
    'professions': 2,
    'entertainment': 2,
    'time': 4,
    'emotions': 4,
    'science': 4,
};

function countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const match = word.match(/[aeiouy]{1,2}/g);
    return match ? match.length : 1;
}

function calculateComplexity(word: string, category: string): number {
    let score = 0;

    // Length Weight
    if (word.length >= 2 && word.length <= 4) score += 1;
    else if (word.length >= 5 && word.length <= 7) score += 3;
    else if (word.length >= 8 && word.length <= 10) score += 5;
    else if (word.length >= 11) score += 7;

    // Syllable Penalty
    const syllables = countSyllables(word);
    if (syllables >= 3) score += 2;
    if (syllables >= 5) score += 2;

    // Category Abstraction Weight
    score += (CATEGORY_WEIGHTS[category] || 0);

    return score;
}

function build() {
    const finalWords: {
        easy: { word: string, meaning: string }[];
        medium: { word: string, meaning: string }[];
        hard: { word: string, meaning: string }[];
    } = { easy: [], medium: [], hard: [] };

    const uniqueTracker = new Set<string>();
    const stats = {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        duplicates: 0,
        invalidLength: 0,
        invalidChars: 0,
        lengths: new Array(20).fill(0),
        categories: {} as Record<string, number>
    };

    const files = fs.readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const categoryName = file.replace('.json', '');
        stats.categories[categoryName] = 0;
        
        const rawContent = fs.readFileSync(path.join(CATEGORIES_DIR, file), 'utf-8');
        let words: string[] = [];
        try {
            words = JSON.parse(rawContent);
        } catch (e) {
            console.error(`Error parsing ${file}`);
            continue;
        }

        for (const rawWord of words) {
            // Check for explicit override
            let wordStr = rawWord.toLowerCase().trim();
            let explicitTier: 'easy' | 'medium' | 'hard' | null = null;
            
            if (wordStr.includes('|')) {
                const parts = wordStr.split('|');
                wordStr = parts[0].trim();
                const tier = parts[1].trim();
                if (['easy', 'medium', 'hard'].includes(tier)) {
                    explicitTier = tier as 'easy' | 'medium' | 'hard';
                }
            }

            // Validations
            if (wordStr.length < 2 || wordStr.length > 16) {
                stats.invalidLength++;
                continue;
            }
            if (!/^[a-z -]+$/.test(wordStr)) {
                stats.invalidChars++;
                continue;
            }

            if (uniqueTracker.has(wordStr)) {
                stats.duplicates++;
                continue;
            }
            uniqueTracker.add(wordStr);

            // Compute Difficulty
            let tier: 'easy' | 'medium' | 'hard' = 'medium';
            if (explicitTier) {
                tier = explicitTier;
            } else {
                const score = calculateComplexity(wordStr, categoryName);
                if (score <= 4) tier = 'easy';
                else if (score <= 7) tier = 'medium';
                else tier = 'hard';
            }

            finalWords[tier].push({ word: wordStr, meaning: "" });
            
            // Track stats
            stats.total++;
            stats[tier]++;
            stats.categories[categoryName]++;
            const l = Math.min(19, wordStr.length);
            stats.lengths[l]++;
        }
    }

    // Sort alphabetically for clean JSON
    finalWords.easy.sort((a, b) => a.word.localeCompare(b.word));
    finalWords.medium.sort((a, b) => a.word.localeCompare(b.word));
    finalWords.hard.sort((a, b) => a.word.localeCompare(b.word));

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalWords, null, 2));

    // Print Report
    console.log('\n=============================================');
    console.log('   WORDBANK PIPELINE REPORT');
    console.log('=============================================');
    console.log(`\n✅ Total Valid Unique Words: ${stats.total}`);
    console.log(`\n📊 Difficulty Distribution:`);
    console.log(`   Easy:   ${stats.easy} (${Math.round(stats.easy/stats.total*100)}%)`);
    console.log(`   Medium: ${stats.medium} (${Math.round(stats.medium/stats.total*100)}%)`);
    console.log(`   Hard:   ${stats.hard} (${Math.round(stats.hard/stats.total*100)}%)`);
    
    console.log(`\n🚫 Rejections:`);
    console.log(`   Duplicates: ${stats.duplicates}`);
    console.log(`   Invalid Length: ${stats.invalidLength}`);
    console.log(`   Invalid Characters: ${stats.invalidChars}`);

    console.log(`\n📂 By Category:`);
    for (const [cat, count] of Object.entries(stats.categories)) {
        console.log(`   ${cat}: ${count}`);
    }

    console.log(`\n📏 Length Distribution:`);
    for (let i = 2; i <= 16; i++) {
        const count = stats.lengths[i];
        const bar = '█'.repeat(Math.ceil(count / 50));
        console.log(`   ${i.toString().padStart(2, ' ')} chars: ${count.toString().padStart(4, ' ')} ${bar}`);
    }
    console.log('=============================================\n');
}

build();
