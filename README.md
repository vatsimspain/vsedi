# VSEDI — VATSIM Spain

Install and configure EuroScope sectors for VATSIM Spain in seconds.

**[Features](#features) • [Wizard Steps](#wizard-steps) • [Setup](#setup) • [Requirements](#requirements) • [Download](#download) • [License](#license)**

---

VSEDI is a desktop application for VATSIM Spain controllers that fully automates the installation and configuration of EuroScope: AIRAC sectors, network credentials, additional plugins, and font settings — all through a guided step-by-step wizard.

## Features

- **One-click sector installation** — automatically downloads and installs AIRACs for the Spanish FIRs (GCCC, LECB, LECM).
- **Live AIRAC status** — the welcome screen shows which AIRAC cycle is installed for each FIR and whether it matches the latest version published on GitHub.
- **EuroScope detection and installation** — detects whether EuroScope is installed and, if not, lets you install it directly from the wizard (recommended version 3.2.3.2 or the latest available).
- **Automatic credential setup** — enter your CID, password, network name, and Hoppie code once; VSEDI writes the configuration into your EuroScope files.
- **Optional extras** — install additional plugins and tools alongside the sectors with a single click.
- **Auto-updates** — the app checks for new versions on startup and displays a banner when one is available.
- **Windows 10 and 11 compatible (maybe soon Linux too!)**.

## Wizard Steps

### Welcome

Shows the current AIRAC installation status per FIR (GCCC, LECB, LECM) compared to the latest published version. If you have sectors already installed, your last used sectors folder is displayed.

### EuroScope

Checks whether EuroScope is installed on the system. If not found, you can install it directly from this step by choosing between the version recommended by VATSIM Spain (3.2.3.2) or the latest available (3.2.13). Download and installation progress are shown in real time.

### Configuration

Enter your VATSIM details:

- **CID** and **password**
- **Network name**
- **Hoppie code** (ACARS logon)
- **Rating** (OBS → ADM)
- **EuroScope font size** (small / medium / large)
- **EuroScope sectors folder** (native folder picker)
- Option to **overwrite existing settings** with the sectors' default values

### Extras

Select additional tools and plugins to install alongside the sectors. This step is optional.

### Progress

Installs the sectors and applies the configuration. Shows the progress of each operation.

### Changelog

Displays the release notes for the current sector version.

## Setup

1. Download and install VSEDI from the [releases page](https://github.com/vatsimspain/vsedi/releases).
2. Open the app and follow the wizard:
   - **EuroScope** — VSEDI will detect it automatically. If it is not installed, install it from this step.
   - **Configuration** — enter your VATSIM credentials and select your EuroScope sectors folder.
   - **Extras** — choose any additional plugins you want to install (optional).
3. Click **Install** on the progress step and wait for it to finish.

> Your configuration is saved between sessions. The next time you open VSEDI your data will already be loaded.

## Requirements

- Windows 10 or 11
- [EuroScope](https://www.euroscope.hu/) (can be installed from within the wizard)
- An active [VATSIM](https://www.vatsim.net/) account
- Membership in [VATSIM Spain](https://vatsimspain.es/)

## Download

Get the latest release from the [GitHub releases page](https://github.com/vatsimspain/vsedi/releases).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to improve.

## Thanks

- [EuroScope](https://www.euroscope.hu/) for the air traffic control software.
- [VATSIM](https://www.vatsim.net/) for the simulation network.
- [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) for the project foundation.

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.en)
