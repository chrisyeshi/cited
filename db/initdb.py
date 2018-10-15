import mysql.connector
from mysql.connector import errorcode

DB_NAME = 'disco'

def connect_database(
    host='dev-db-server.cs6gjqtgg2dt.us-east-2.rds.amazonaws.com',
    # host='localhost',
    user='disco'
):
    cnx = mysql.connector.connect(
        host=host,
        user=user,
        passwd='MakeBestTech:0',
        database=DB_NAME
    )
    return cnx
    
def setup_database():
    cnx = connect_database()
    cursor = cnx.cursor()
    TABLES = {}
    TABLES['papers'] = (
        "CREATE TABLE `papers` ("
        "  `id` int(11) NOT NULL AUTO_INCREMENT,"
        "  `title` varchar(255) NULL DEFAULT NULL,"
        "  `doi` varchar(45) NULL DEFAULT NULL,"
        "  `year` smallint(6) NULL DEFAULT NULL,"
        "  `citations` smallint(6) NOT NULL DEFAULT 0,"
        "  `references` smallint(6) NOT NULL DEFAULT 0,"
        "  `journal_id` varchar(8) NULL DEFAULT NULL,"
        "  `conference_id` varchar(8) NULL DEFAULT NULL,"
        "  `hexcode` varchar(8) NULL DEFAULT NULL,"
        "  `date` datetime NULL DEFAULT NULL,"
        "  `rank` smallint(6) NULL DEFAULT NULL,"
        "  PRIMARY KEY (`id`),"
        "  FULLTEXT KEY `paper_title` (`title`)"
        ") ENGINE=InnoDB")

    TABLES['authors'] = (
        "CREATE TABLE `authors` ("
        "  `id` varchar(8) NOT NULL,"
        "  `name` varchar(50) NULL DEFAULT NULL,"
        "  PRIMARY KEY (`id`)"
        ") ENGINE=InnoDB")

    TABLES['paper_authors'] = (
        "CREATE TABLE `paper_authors` ("
        "  `paper_id` varchar(8) NOT NULL,"
        "  `author_id` varchar(8) NOT NULL,"
        "  PRIMARY KEY (`paper_id`, `author_id`)"
        ") ENGINE=InnoDB")

    TABLES['conferences'] = (
        "CREATE TABLE `conferences` ("
        "  `id` varchar(8) NOT NULL,"
        "  `name` varchar(255) NULL DEFAULT NULL,"
        "  `shortname` varchar(15) NULL DEFAULT NULL,"
        "  PRIMARY KEY (`id`)"
        ") ENGINE=InnoDB")

    TABLES['journals'] = (
        "CREATE TABLE `journals` ("
        "  `id` varchar(8) NOT NULL,"
        "  `name` varchar(255) NOT NULL,"
        "  PRIMARY KEY (`id`)"
        ") ENGINE=InnoDB")

    TABLES['paper_references'] = (
        "CREATE TABLE `paper_references` ("
        "  `paper_id` varchar(8) NOT NULL,"
        "  `reference_id` varchar(8) NOT NULL,"
        "  PRIMARY KEY (`paper_id`, `reference_id`)"
        ") ENGINE=InnoDB")

    def create_database(cursor):
        try:
            cursor.execute(
                "CREATE DATABASE {} DEFAULT CHARACTER SET 'utf8'".format(DB_NAME))
        except mysql.connector.Error as err:
            print("Failed creating database: {}".format(err))
            exit(1)

    try:
        cursor.execute("USE {}".format(DB_NAME))
    except mysql.connector.Error as err:
        print("Database {} does not exists.".format(DB_NAME))
        if err.errno == errorcode.ER_BAD_DB_ERROR:
            create_database(cursor)
            print("Database {} created successfully.".format(DB_NAME))
            cnx.database = DB_NAME
        else:
            print(err)
            exit(1)

    for table_name in TABLES:
        table_description = TABLES[table_name]
        try:
            print("Creating table {}: ".format(table_name), end='')
            cursor.execute(table_description)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print("already exists.")
            else:
                print(err.msg)
        else:
            print("OK")

    cursor.close()
    cnx.close()

if __name__ == '__main__':
    setup_database()