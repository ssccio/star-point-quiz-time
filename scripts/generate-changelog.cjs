#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../public/changelog.json');
const MAX_COMMITS = 50;

/**
 * Generate changelog from git log
 */
function generateChangelog() {
  try {
    console.log('Generating changelog...');

    // Get git log with custom format
    const gitLog = execSync(
      `git log --pretty=format:"%H|%h|%s|%an|%at" -n ${MAX_COMMITS}`,
      { encoding: 'utf8' }
    );

    if (!gitLog.trim()) {
      console.log('No git commits found');
      return;
    }

    // Parse git log entries
    const commits = gitLog
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, shortHash, message, author, timestamp] = line.split('|');
        return {
          hash: hash?.trim(),
          shortHash: shortHash?.trim(),
          message: message?.trim(),
          author: author?.trim(),
          timestamp: parseInt(timestamp?.trim()) || Date.now() / 1000,
          date: new Date(parseInt(timestamp?.trim()) * 1000).toISOString()
        };
      })
      .filter(commit => commit.hash && commit.message); // Filter out invalid entries

    // Get build info
    const buildInfo = {
      generatedAt: new Date().toISOString(),
      totalCommits: commits.length,
      latestCommit: commits[0]?.hash || null,
      repository: 'ssccio/star-point-quiz-time'
    };

    const changelogData = {
      buildInfo,
      commits
    };

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write changelog file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(changelogData, null, 2));

    console.log(`✅ Changelog generated with ${commits.length} commits`);
    console.log(`📄 Output: ${OUTPUT_FILE}`);
    console.log(`🕒 Latest commit: ${commits[0]?.shortHash} - ${commits[0]?.message.substring(0, 60)}...`);

  } catch (error) {
    console.error('❌ Failed to generate changelog:', error.message);

    // Create fallback changelog if git fails
    const fallbackChangelog = {
      buildInfo: {
        generatedAt: new Date().toISOString(),
        totalCommits: 0,
        latestCommit: null,
        repository: 'ssccio/star-point-quiz-time',
        error: 'Git log unavailable during build'
      },
      commits: []
    };

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbackChangelog, null, 2));
    console.log('📄 Created fallback changelog');

    // Don't exit with error - build should continue
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  generateChangelog();
}

module.exports = { generateChangelog };
