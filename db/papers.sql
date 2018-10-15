-- MySQL dump 10.16  Distrib 10.1.33-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: academic_graph
-- ------------------------------------------------------
-- Server version	10.1.33-MariaDB-1~trusty

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


USE academic_graph;

--
-- Table structure for table `paper_author_affiliations`
--

DROP TABLE IF EXISTS `paper_author_affiliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paper_author_affiliations` (
  `paper_id` varchar(8) NOT NULL,
  `author_id` varchar(8) NOT NULL,
  `affiliation_id` varchar(8) DEFAULT NULL,
  `affiliation_name` varchar(255) DEFAULT NULL,
  `affiliation_name_normalized` varchar(255) DEFAULT NULL,
  `author_sequence` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `papers`
--

DROP TABLE IF EXISTS `papers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `papers` (
  `id` varchar(8) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `title_normalized` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `doi` varchar(45) DEFAULT NULL,
  `venue` varchar(45) DEFAULT NULL,
  `venue_normalized` varchar(45) DEFAULT NULL,
  `journal_id` varchar(8) DEFAULT NULL,
  `conference_id` varchar(8) DEFAULT NULL,
  `rank` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title_norm` (`title_normalized`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `references`
--

DROP TABLE IF EXISTS `paper_references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paper_references` (
  `paper_id` varchar(8) NOT NULL,
  `reference_id` varchar(8) NOT NULL,
  KEY `reference_id` (`reference_id`),
  KEY `pid` (`paper_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-12 22:19:06
