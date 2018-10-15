import mysql.connector
from mysql.connector import errorcode

BATCH_SIZE = 100
CS_HEXCODE = '0271BC14'
VERBOSE_MODE = False

mag_conn = mysql.connector.connect(
    host='localhost',
    user='disco',
    database='academic_graph',
    passwd=''
)
mag_db = mag_conn.cursor(dictionary=True, buffered=True)

aws_conn = mysql.connector.connect(
    host='localhost',
    user='disco',
    database='disco',
    passwd=''
)
aws_db = aws_conn.cursor()

def select_cs_papers():
    mag_db.execute("SELECT distinct parent_id from `field_hierarchy` WHERE `parent_level` = 'L0'")
    majors = [ m['parent_id'] for m in mag_db.fetchall() ]
    # print(majors)

    mag_db.execute("SELECT * from `keywords` LIMIT " + str(BATCH_SIZE))
    results = mag_db.fetchall()

    inserted = 0
    crawled = 0

    for result in results: 
        # print(result['field_id'])
        crawled += 1
        mag_db.execute("SELECT * from `field_hierarchy` WHERE `parent_level` = 'L0' AND `child_id` = '" + result['field_id'] + "'")
        top_fields = mag_db.fetchall()
        # print(top_fields)
        isCS =  CS_HEXCODE in [d['parent_id'] for d in top_fields ]
        print(isCS, crawled)
        if(isCS):
            numRefs = insert_references(result['paper_id'])
            pp = insert_paper(result['paper_id'], numRefs)
            insert_authors(result['paper_id'])
            inserted+=1

    print(inserted)
    aws_db.close()
    mag_db.close()

def insert_paper(paper_id, numRefs):
    mag_db = mag_conn.cursor(dictionary=True, buffered=True)
    mag_db.execute("SELECT * from `papers` WHERE `id` = '" + paper_id + "'")

    sql = ("INSERT INTO papers "
    "(hexcode, title, doi, year, journal_id, conference_id, rank, date, references) "
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
        print('paper info: ', val)
    mycursor.executemany(sql, val)
    return paper

def insert_references(paper_id):
    mag_db = mag_conn.cursor()
    mag_db.execute("SELECT * from `paper_references` WHERE `paper_id` = '" + paper_id + "'")
    refs = mag_db.fetchall()
    sql = ("INSERT INTO paper_references "
    "(from, to)) "
    "VALUES (%s, %s) ")
    aws_db.execute.excute(sql, refs)
    return len(refs)

def insert_authors(paper_id):
    mag_db = mag_conn.cursor()
    mag_db.execute("SELECT * from `paper_author_affiliations` WHERE `paper_id` = '" + paper_id + "'")
    authors = mag_db.fetchall()
    print('fetching author info', paper_id, authors)
    sql = ("INSERT INTO paper_authors "
    "(paper_id, author_id)) "
    "VALUES (%s, %s)")

    aws_db.execute.excute(sql, authors)

    for author in authors:
        author_id = author[1]
        aws_db.execute("SELECT id from `authors` WHERE `id` = '" + author_id + "'")
        exist_authors = aws_db.fetchall()
        print('existing authors: ', exist_authors)
        if(len(exist_authors) == 0):
            mag_db.execute("SELECT * from `authors` WHERE `id` = '" + author_id + "'")
            author_record = mag_db.fetchall()
            print('author info: ', author_record)
            aws_db.execute("INSERT INTO authors (id, name) VALUES (%s, %s)", author_record)

    return authors



if __name__ == '__main__':
    select_cs_papers()