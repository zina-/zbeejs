CREATE DATABASE `zbeejs` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `zbeejs`;

CREATE TABLE `postings` (
  `Permalink` varchar(100) NOT NULL,
  `Subject` varchar(255) DEFAULT NULL,
  `ChangedTimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Content` varchar(10000) DEFAULT NULL,
  `PublishedTimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `IsPublished` tinyint(1) DEFAULT '0',
  `OriginFilename` varchar(255) NOT NULL,
  PRIMARY KEY (`Permalink`),
  UNIQUE KEY `OriginFilename_UNIQUE` (`OriginFilename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `crawler` (
  `Cursor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Cursor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
