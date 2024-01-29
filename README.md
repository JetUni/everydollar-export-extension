
<div align="center">
<img src="public/icon-128.png" alt="logo"/>

<h3>Everydollar Data Exporter, by Jarrett Sorensen</h3>

> Effortlessly export your Everydollar budgets to CSV.

<!-- ![](https://img.shields.io/github/actions/workflow/status/monarchmoney/mint-export-extension/test.yml)
![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

<div align="center">
<img src=".github/img/banner.png" width="80%" alt="screenshot of the extension" />
</div> -->


</div>

## Features
* Download your monthly budgets for all months

## Installation

### Chrome Web Store
https://chromewebstore.google.com/detail/mint-data-exporter-by-mon/doknkjpaacjheilodaibfpimamfgfhap?hl=en&pli=1

### Chrome Web Extension (unpacked)
1. [Download the latest release zip](https://github.com/JetUni/everydollar-export-extension/releases/latest/download/chrome-extension.zip) and unpack it
2. Open Chrome and navigate to `chrome://extensions`
3. Enable developer mode
4. Click on "Load unpacked" and select the folder you unpacked the zip to

### From Source

Pre-requisites: [pnpm](https://pnpm.io/)

1. Clone this repository
2. Run `pnpm install`
3. Run `pnpm build` (a `dist` folder will be created)
4. Open Chrome and navigate to `chrome://extensions`
5. Enable developer mode
6. Click on "Load unpacked" and select the created `dist` folder

## Usage

1. Install the extension (see above).
2. Head to https://everydollar.com and log in to your Everydollar account.
3. Click the extension button to get started.

## Contributing
Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for more information.

## Licensing Information
This project is based on [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) which is licensed under the MIT License (see `LICENSE`). Our modifications and additional code are licensed under the GNU General Public License (GPL), which is detailed in `LICENSE-GPL`.

## FAQ

### What does this do?
This is a Chrome extension that lets you export all of your budget data from Everydollar, since Everydollar only allows you to export transactions and not budgets. You could use this if you want to move to another an alternative, like Tiller, or if you simply want to preserve your data history.

### Why use this tool? Can’t I export things manually?

You *could* export things manually instead, but as users have moved from Everydollar to Tiller, there are limited options for exports. This tool helps address that

- **Export all budgets.** When exporting historical budget plans out of Everydollar, users will have to manually enter the budget for each month and type them out one by one. This tool will download a list of all budget plans and their amounts for all months into a single sheet
- **Export monthly budgets with funds info for all categories.** When exporting historical budget data out of Everydollar, users will have to manually enter the budget for each month and view the savings rollovers for each category for each month. This tool will loop through and export monthly budgets, the planned amounts, the spent amounts, and the rollover amounts for all categories that use the savings funds.

### Is this free?
Yes.

### Is it secure?
This tool does everything locally. Your data is not sent anywhere. It will re-use an API key from a local, logged in session to everydollar.com. It won’t store anything remotely or send data anywhere else. All data downloaded will be stored locally for you so you can decide what you do with it.

### Can I use this without Tiller?
Absolutely! This tool simply exports all your data and saves them locally. It doesn’t send anything to Tiller and it doesn’t require you to have a Tiller account. You could later import those files to Tiller or to any other tool, but you don’t have to.

### Can I use this _with_ Tiller?
Yes! Check [this guide](https://community.tillerhq.com/).
