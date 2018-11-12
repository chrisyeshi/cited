import mysql.connector
from mysql.connector import errorcode

NUMBER_OF_PAPERS = 126909021
BATCH_SIZE = 50000
START_AT = 0

def processPapers():

    conf_file = open('conferences.txt', 'r')
    conferences = conf_file.read().strip().split('\n')
    journal_file = open('journals.txt', 'r')
    journals = journal_file.read().strip().split('\n')
    conf_file.close()
    journal_file.close()

    mag_conn = mysql.connector.connect(
        host='localhost',
        user='disco',
        database='academic_graph',
        passwd='MakeBestTech:0'
    )
    mag_db = mag_conn.cursor(dictionary=True, buffered=True)

    aws_conn = mysql.connector.connect(
        # host='dev-db-server.cs6gjqtgg2dt.us-east-2.rds.amazonaws.com',
        host='localhost',
        user='disco',
        database='disco',
        passwd='MakeBestTech:0'
    )
    aws_db = aws_conn.cursor()

    def select_cs_papers(start=0, limit=10):
        crawled = start
        mag_db.execute("SELECT * from `papers` LIMIT " + str(crawled) + "," + str(limit))
        papers = mag_db.fetchall()

        inserted = 0
        processed = 0

        for paper in papers: 
            isCS = False

            if(paper['doi'] is None):
                isCS = False
            elif(paper['conference_id'] is not None):
                isCS = paper['conference_id'] in conferences
            elif(paper['journal_id'] is not None):
                isCS = paper['journal_id'] in journals
      
            # print(isCS)
            if(isCS):
                numRefs, numCited = insert_references(paper['id'])
                if(numRefs > 0 or numCited > 0):
                    pp = insert_paper(paper, numRefs, numCited)
                    insert_authors(paper['id'])
                    # aws_conn.commit()
                inserted+=1
            
            processed += 1
            print("Inserted %d CS papers from (%d/%d) papers" % (inserted, processed, BATCH_SIZE), end="\r")
        
        crawled += limit
        aws_conn.commit()

        return (crawled, inserted)

    def insert_paper(paper, numRefs, numCited):
        sql = ("INSERT INTO papers "
        "(hexcode, title, doi, year, journal_id, conference_id, rank, date, `references`, `citations`) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ")

        val = (paper['id'],
            paper['title'],
            paper['doi'],
            paper['year'],
            paper['journal_id'],
            paper['conference_id'],
            paper['rank'],
            paper['date'],
            numRefs,
            numCited
        )
        aws_db.execute(sql, val)
        # aws_conn.commit()
        return paper

    def insert_references(paper_id):
        mag_db = mag_conn.cursor()
        mag_db.execute("SELECT * from `paper_references` WHERE `paper_id` = '" + paper_id + "'")
        refs = mag_db.fetchall()

        mag_db.execute("SELECT * from `paper_references` WHERE `reference_id` = '" + paper_id + "'")
        cited_bys = mag_db.fetchall()


        sql = ("INSERT IGNORE INTO paper_references "
        "(paper_id, reference_id) "
        "VALUES (%s, %s)")

        if(len(refs) > 0):
            aws_db.executemany(sql, refs)
            # aws_conn.commit()
        
        if(len(refs) > 0):
            aws_db.executemany(sql, cited_bys)
            # aws_conn.commit()
        

        return len(refs), len(cited_bys)

    def insert_authors(paper_id):
        mag_db = mag_conn.cursor()
        mag_db.execute("SELECT paper_id, author_id from `paper_author_affiliations` WHERE `paper_id` = '" + paper_id + "'")
        authors = mag_db.fetchall()
        # print('fetching author info', paper_id, authors)
        aws_db.executemany("INSERT IGNORE INTO paper_authors (paper_id, author_id) VALUES (%s, %s)", authors)

        for author in authors:
            author_id = author[1]
            
            aws_db.execute("SELECT id from `authors` WHERE `id` = '" + author_id + "'")
            exist_authors = aws_db.fetchall()
            if(len(exist_authors) == 0):
                mag_db.execute("SELECT * from `authors` WHERE `id` = '" + author_id + "'")
                author_record = mag_db.fetchall()
                aws_db.executemany("INSERT IGNORE INTO authors (id, name) VALUES (%s, %s)", author_record)

        return authors


    log = open('processed_total.txt', 'r+')
    start_at = int(log.read())

    # print('Data import starts at', start_at)
    if start_at < NUMBER_OF_PAPERS:
        walked, selected = select_cs_papers(start_at, BATCH_SIZE)
    # print('\n')
    log.seek(0)
    log.write(str(walked))
    log.close()
    aws_db.close()
    mag_db.close()

if __name__ == '__main__':
    for x in range(200):
        print("iter %d" % x)
        processPapers()


