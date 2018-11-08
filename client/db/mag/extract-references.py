import mysql.connector
from mysql.connector import errorcode
import time

NUMBER_OF_PAPERS = 126909021
BATCH_SIZE = 1000
START_AT = 0
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
        host='localhost',
        user='disco',
        database='disco',
        passwd='MakeBestTech:0'
    )
    aws_db = aws_conn.cursor()

    def extract_references(start=0, limit=10):

        crawled = start
        aws_db.execute("SELECT paper_id, reference_id from `paper_references` LIMIT " + str(crawled) + "," + str(limit))
        results = aws_db.fetchall()

        citings = [p for p,r in results]
        citedBys = [r for p,r in results]

        paper_ids = set(citings + citedBys)

        aws_db.execute("SELECT id, hexcode from `papers` WHERE hexcode in (%s)" % ','.join([ "'" + str(j) +"'" for j in paper_ids]))
        ex_paper_ids = aws_db.fetchall()
   
        if(len(ex_paper_ids) > 0):
            paper_ids = paper_ids - set([e for i,e in ex_paper_ids])
        
        inserted = 0

        mag_db.execute("SELECT * from `papers` WHERE id in (%s)" % ','.join([ "'" + str(j) +"'" for j in paper_ids]))
        papers = mag_db.fetchall()

        for paper in papers: 
            numRefs, numCited = insert_references(paper['id'])
            if(numRefs > 0 or numCited > 0):
                # print(paper)
                insert_paper(paper, numRefs, numCited)
                insert_authors(paper['id'])
                inserted += 1
    
            print("Inserted %d CS papers from (%d) papers" % (inserted, BATCH_SIZE), end="\r")

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

    log = open('processed_refs.txt', 'r+')
    start_at = int(log.read())

    if start_at < NUMBER_OF_PAPERS:
        walked, selected = extract_references(start_at, BATCH_SIZE)
    # print('\n')
    log.seek(0)
    log.write(str(walked))
    log.close()
    aws_db.close()
    mag_db.close()

if __name__ == '__main__':
    for x in range(50):
        print("iter %d" % x)
        processPapers()
        time.sleep(10)


