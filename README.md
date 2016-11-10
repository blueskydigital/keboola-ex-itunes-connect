# iTunes Connect Extractor v3

Integration of iTunes Connect API with [Keboola Connection](https://connection.keboola.com/). Written in Node.js & [Apple iTunes Reporter API](https://help.apple.com/itc/contentreporterguide/#/itc0f2481229).

iTunes Connect Extractor wraps-up the key functionality of Apple iTunes Reporter API and utilize the flexibility of [Keboola Connection](https://connection.keboola.com/) and [Docker](https://www.docker.com/) ecosystem. It's been built with strong focus on extensibility and simplicity.

## Dataset supports

Current version supports downloading both **Sales data** and **Financial (Earnings)**. **Sales data** can be downloaded with **Daily/Summary** settings per **VendorId**. **Earnings** on the other hand can be downloaded with **5-4-4 fiscal dimension settings**. Per VendorId as well.

## Sales Dataset

Downloading of the **Sales data** is the basic option. There is a possibility of downloading of the daily data with a history that contains last 364 days. A default bucket name and storage name is going to be applied.

### Recommended configuration

    {
      "vendors": [ vendorId1, ..., vendorIdN ],
      "reportType": "sales",
      "startDate": "YYYYMMDD (optional, if not specified, a default date is used)",
      "endDate": "YYYYMMDD (optional, if not specified, a default date is used)",
      "#username": "iTunes Username, will be encrypted",
      "#password": "iTunes Password, will be encrypted"
    }

Note: Default date is today - 2. If you don't specify optional parameters ("startDate", "endDate"), it will be applied. Otherwise the range from both attributes ("startDate", "endDate") will be used (the date format is YYYYMMDD).

## Financial (Earnings) Dataset

Downloading of Earnings data is very simple as well. The major improvement of the current version (v3) of the iTunes Connect Extractor is avoiding some extra configuration parameters. Everything is done automatically. Current version contains a very handy 5-4-4 fiscal calendar (results checked against Apple Fiscal Calendar, leaps years are included as well) and now is possible to fully automate the process.

### Recommended configuration

    {
      "vendors": [ vendorId1, ..., vendorIdN ],
      "reportType": "financial",
      "startDate": "YYYYMMDD (optional, if not specified, a default date is used)",
      "endDate": "YYYYMMDD (optional, if not specified, a default date is used)",
      "#username": "iTunes Username, will be encrypted",
      "#password": "iTunes Password, will be encrypted"
    }

Note: Default date is today - 2. If you don't specify optional parameters ("startDate", "endDate"), it will be applied. Otherwise the range from both attributes ("startDate", "endDate") will be used (the date format is YYYYMMDD). There is also a limitation for Sales dataset. You can download only 60 days in one run (this is a limitation of the extractor, not the iTunes Reporting API). If you want to download more data, just update the dates in the configuration accordingly. 

See the [iTunes Connect official guide](https://help.apple.com/itc/contentreporterguide/#/itc0f2481229) for more information about the parameters.
