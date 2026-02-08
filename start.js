/**
 * WASI-MD V7 Starter
 * Entry point that launches the real bot from the loaded core
 * © ITXXWASI - All Rights Reserved
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CORE_DIR = path.join(__dirname, 'core');
const ENTRY_FILE = 'index.js';

async function runLoader() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('   📦 WASI-MD V7 - LOADING BOT CODE');
    console.log('═══════════════════════════════════════════════\n');

    try {
        // Run the loader
        require('./itxxwasi.js');

        // Wait for loader to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check again
        if (!fs.existsSync(CORE_DIR)) {
            // Check if we are in a container where code is in root
            if (fs.existsSync(path.join(__dirname, 'index.js'))) {
                return; // Code is in root, that's fine
            }
            console.error('❌ Loader failed to download bot code.');
            console.error('   Please check GITLAB_TOKEN is set correctly.\n');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Loader error:', err.message);
        process.exit(1);
    }
}

async function start() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('   ⚡ WASI-MD V7 - STARTING BOT');
    console.log('═══════════════════════════════════════════════\n');

    let entryPath = path.join(CORE_DIR, ENTRY_FILE);
    let workDir = CORE_DIR;

    // Check if we are in Docker container where index.js is in root
    if (!fs.existsSync(CORE_DIR) && fs.existsSync(path.join(__dirname, ENTRY_FILE))) {
        entryPath = path.join(__dirname, ENTRY_FILE);
        workDir = __dirname;
    } else if (!fs.existsSync(CORE_DIR)) {
        // Check if core exists, if not run loader first
        console.log('📦 Core not found, running loader...\n');
        await runLoader();
        entryPath = path.join(CORE_DIR, ENTRY_FILE);
        workDir = CORE_DIR;
    }

    // Verify entry file exists
    if (!fs.existsSync(entryPath)) {
        console.error(`❌ ERROR: Entry file "${ENTRY_FILE}" not found!`);
        console.error('   Please check your repository structure.\n');
        process.exit(1);
    }

    console.log(`🤖 Launching WASI-MD V7...`);
    console.log(`   Entry: ${ENTRY_FILE}\n`);

    // Spawn the bot process
    const bot = spawn('node', [entryPath], {
        cwd: workDir,
        stdio: 'inherit',
        env: process.env
    });

    bot.on('error', (err) => {
        console.error('❌ Failed to start bot:', err.message);
        process.exit(1);
    });

    bot.on('exit', (code) => {
        console.log(`\n🛑 Bot exited with code: ${code}`);
        process.exit(code || 0);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
        bot.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
        console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
        bot.kill('SIGINT');
    });
}

start();
