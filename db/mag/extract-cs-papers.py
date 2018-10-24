import mysql.connector
from mysql.connector import errorcode

NUMBER_OF_PAPERS = 126909021
BATCH_SIZE = 1000
START_AT = 0
CS_HEXCODE = '0271BC14'
VERBOSE_MODE = False

def processPapers():

    mag_conn = mysql.connector.connect(
        host='localhost',
        user='disco',
        database='academic_graph',
        passwd='MakeBestTech:0'
    )
    mag_db = mag_conn.cursor(dictionary=True, buffered=True)

    aws_conn = mysql.connector.connect(
        host='dev-db-server.cs6gjqtgg2dt.us-east-2.rds.amazonaws.com',
        user='disco',
        database='disco',
        passwd='MakeBestTech:0'
    )
    aws_db = aws_conn.cursor()

    def select_cs_papers(start=0, limit=10):
        mag_db.execute("SELECT distinct parent_id from `field_hierarchy` WHERE `parent_level` = 'L0'")
        majors = [ m['parent_id'] for m in mag_db.fetchall() ]
        # print(majors)

        crawled = start
        mag_db.execute("SELECT * from `keywords` LIMIT " + str(crawled) + "," + str(limit))
        results = mag_db.fetchall()

        inserted = 0
        processed = 0

        for result in results: 
            # print(result['field_id'])
            
            mag_db.execute("SELECT * from `field_hierarchy` WHERE `parent_level` = 'L0' AND `child_id` = '" + result['field_id'] + "'")
            top_fields = mag_db.fetchall()
            # print(top_fields)
            isCS =  CS_HEXCODE in [d['parent_id'] for d in top_fields ]
            # print(isCS, crawled)
            if(isCS):
                numRefs = insert_references(result['paper_id'])
                pp = insert_paper(result['paper_id'], numRefs)
                insert_authors(result['paper_id'])
                aws_conn.commit()
                inserted+=1
            processed += 1
            print("Inserted %d CS papers from (%d/%d) papers" % (inserted, processed, BATCH_SIZE), end="\r")

        crawled += limit
        aws_conn.commit()

        return (crawled, inserted)

    def insert_paper(paper_id, numRefs):
        mag_db = mag_conn.cursor(dictionary=True, buffered=True)
        mag_db.execute("SELECT * from `papers` WHERE `id` = '" + paper_id + "'")

        sql = ("INSERT INTO papers "
        "(hexcode, title, doi, year, journal_id, conference_id, rank, date, `references`) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ")

        paper = mag_db.fetchone()
        if(paper != None):
            val = (paper['id'],
                paper['title'],
                paper['doi'],
                paper['year'],
                paper['journal_id'],
                paper['conference_id'],
                paper['rank'],
                paper['date'],
                numRefs
            )
            # print('paper info: ', val)
        aws_db.execute(sql, val)
        # aws_conn.commit()
        return paper

    def insert_references(paper_id):
        mag_db = mag_conn.cursor()
        mag_db.execute("SELECT * from `paper_references` WHERE `paper_id` = '" + paper_id + "'")
        refs = mag_db.fetchall()
        sql = ("INSERT IGNORE INTO paper_references "
        "(paper_id, reference_id) "
        "VALUES (%s, %s)")
        aws_db.executemany(sql, refs)
        # aws_conn.commit()
        return len(refs)

    def insert_authors(paper_id):
        mag_db = mag_conn.cursor()
        mag_db.execute("SELECT * from `paper_author_affiliations` WHERE `paper_id` = '" + paper_id + "'")
        authors = mag_db.fetchall()
        # print('fetching author info', paper_id, authors)
        sql = ("INSERT IGNORE INTO paper_authors "
        "(paper_id, author_id) "
        "VALUES (%s, %s)")
        # print(paper_id, authors)

        for author in authors:
            author_id = author[1]
            aws_db.execute(sql, (paper_id, author_id))

            aws_db.execute("SELECT id from `authors` WHERE `id` = '" + author_id + "'")
            exist_authors = aws_db.fetchall()
            # print('existing authors: ', exist_authors)
            if(len(exist_authors) == 0):
                mag_db.execute("SELECT * from `authors` WHERE `id` = '" + author_id + "'")
                author_record = mag_db.fetchall()
                # print('author info: ', author_record)
                aws_db.executemany("INSERT IGNORE INTO authors (id, name) VALUES (%s, %s)", author_record)
                # aws_conn.commit()
        return authors


    log = open('processed_total.txt', 'r+')
    start_at = int(log.read())
    # print('Data import starts at', start_at)
    if start_at < NUMBER_OF_PAPERS:
        walked, selected = select_cs_papers(start_at, BATCH_SIZE)
    # print('\n')
    # print('Total number of papers inserted: ', selected)
    log.seek(0)
    log.write(str(walked))
    log.close()
    aws_db.close()
    mag_db.close()

if __name__ == '__main__':
    for x in range(100):
        try:
            processPapers()
        except:
            pass

