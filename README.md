# iTunes Connect Extractor v2

Integration of iTunes Connect API with [Keboola Connection](https://connection.keboola.com/). Written in Node.js & [Apple-Autoingestion NPM](https://www.npmjs.com/package/apple-autoingestion) tool.

Apple released the AutoIngestion tool that helps downloading iTunes Connect related data for further processing. Originally written in Java, the tool allowed to put several parameters in order to download desired datasets.

iTunes Connect Extractor wraps-up the key functionality of Apple's AutoIngestion tool and utilize the flexibility of [Keboola Connection](https://connection.keboola.com/) and [Docker](https://www.docker.com/) ecosystem. It's been built with strong focus on extensibility and simplicity.

## Dataset supports

Current version supports downloading both **Sales data** and **Earnings**. **Sales data** can be downloaded with **Daily/Summary** or **Weekly/Detailed** settings per **VendorId**. **Earnings** on the other hand can be downloaded with **5-4-4 fiscal dimension setting**s & **listing of available region codes**. Per VendorId as well.

## Docker image

The code in this repository has been built with strong focus on being used as a part of Keboola ecosystem (an extractor component) and the desired integration was considered to be done via Docker image.

## Dependencies

The iTunes Connect Extractor package has been written in JavaScript (Node.js library) completely. There are several dependencies that are cruicial to be installed for a successful run.

* apple-autoingestion (0.1.1) - a package enabling the functionality from Apple's AutoIngestion tool.
* commander (2.8.1) - a helper for managing the input commands.
* fast-csv (0.6.0) - a useful library for working with CSV files.
* moment (2.10.3) - a library for handling date/time/zones.
* twix (0.6.4) - an extension of moment that adds functionality for working with date ranges.
* jsonfile (2.2.1) - a library for handling the JSON files more smoothly.
* lodash (3.10.0) - a npm package that simplifies work with collections.
* nconf (0.7.1) - a library for hierarchical node.js configuration, working with JSON files.
* is-there (4.0.0) - a simple wrapper that helps to check efficiently whether a directory exists or not.
* temp (0.8.3) - a simple package that helps with handling the temporary files.
* rimraf (2.4.2) - a simple util that executes rm -rf command.
* q (1.4.1) - a library for handling promises.
* crypto (0.0.3) - a small util for generating MD5 hashes.

### Package instalation

For installation of all external packages just type **npm install** in the command line in the root directory of Node-AutoIngestion - Docker App package.

## Sales Dataset

Downloading of the **Sales data** is the basic option. There is a possibility of downloading of the daily/weekly data with a history that contains last 364 days.

### Recommended configuration

    {
      "bucket_name": "in.c-itunes_new",
      "itunes_type": "sales",
      "table_name": "sales",
      "sales_grain": "daily",
      "sales_report_type": "summary",
      "primary_keys": [
        "Provider",
        "Provider Country",
        "Vendor Identifier",
        "Title",
        "Label/Studio/Network",
        "Product Type Identifier",
        "Begin Date",
        "End Date",
        "Customer Currency",
        "Country Code",
        "Royalty Currency",
        "Apple Identifier",
        "Asset/Content Flavor",
        "Vendor Offer Code"
      ],
      "vendor_id": [vendorId1, ..., vendorIdN],
      "#username": "iTunes Username, will be encrypted",
      "#password": "iTunes Password, will be encrypted"
    }

Note: Default date is today - 2. If you don't specify optional parameters ("date_from", "date_to"), it will be applied. Otherwise the range from both attributes ("date_from", "date_to") will be used (the date format is YYYYMMDD).

See the [Oficial Apple ITunes Connect Guide](http://itunesconnect.apple.com/docs/Content_Payments_Finance_Reports_Guide.pdf) for more information about the parameters.

## Earnings Dataset

Downloading of Earnings data is the major improvement of the current version (v2) of the iTunes Connect Extractor. The major blocker in the previous version was a need to specify a date in special 5-4-4 fiscal date format (to have an ability to download data consistently). Current version contains a very precise generator (results checked against Apple Fiscal Calendar, leaps years are included as well) and now is possible to fully automate the process.

### Recommended configuration

    {
      "bucket_name": "in.c-itunes_new",
      "itunes_type": "earnings",
      "table_name": "earnings",
      "primary_keys": [
        "Start Date",
        "End Date",
        "Vendor Identifier",
        "Partner Share Currency",
        "Sales or Return",
        "Apple Identifier",
        "Title",
        "Product Type Identifier",
        "Country Of Sale",
        "Customer Currency"
      ],
      "vendor_id": [vendorId1, ..., vendorIdN],
      "regions": [ "AE","AU","CA","CH","DK","EU","GB","HK","ID","IL","IN","JP","MX","NO","NZ","RU","SA","SE","SG","TR","TW","US","WW","ZA"
      ],
      "#username": "iTunes Username, will be encrypted, don't forget to add hash at the beginning of the attribute name",
      "#password": "iTunes Password, will be encrypted, don't forget to add hash at the beginning of the attribute name"
    }

Note: Default date returns current 5-4-4 fiscal period. If you add optional parameters ("date_from", "date_to"), it will generate 5-4-4 periods for each date withing specified period and start downloading data for all of them.

See the [iTunes Connect Payments and Financial Reports Guide](http://help.apple.com/itc/contentpayments/#/itc4779c0edf) for more information about the parameters.