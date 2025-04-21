# VHLFans Chrome Extension

A Chrome extension that helps automate VHL Central activities by adding a "Cheat with VHLFans" button to the activity page.

## Features

- Adds a purple "Cheat with VHLFans" button to the top navigation bar of VHL activities
- Extracts questions from the activity page
- Sends questions to the VHLFans API to get answers
- Automatically fills in the answers on the page
- Plays loading music while waiting for answers
- Shows visual effects (pulsing blue/green outline) during loading and after success

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension is now installed and will be active on VHL Central activity pages

## Usage

1. Navigate to a VHL Central activity page (https://m3a.vhlcentral.com/sections/*)
2. Click the "Cheat with VHLFans" button in the top navigation bar
3. Wait for the extension to extract questions, get answers, and fill them in
4. Enjoy your completed activity!

## Technical Details

The extension is built using:
- Manifest V3 compliant Chrome extension API
- JavaScript for content scripts and background service worker
- CSS for styling and animations

## API Endpoints

The extension communicates with two API endpoints:
- `https://app.vhlfans.owensucksat.life/get_some_fun` - Gets loading music
- `https://app.vhlfans.owensucksat.life/cheat_engine/classic_cheat` - Gets answers for questions

## License

This project is for educational purposes only.
