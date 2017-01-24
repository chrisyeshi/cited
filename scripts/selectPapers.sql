use academic_graph;
select DISTINCT(id), title, year, date, doi, venue, journal_id, conference_id, rank
from papers,
  ( SELECT paper_id from `references`,
       (
          select * from papers 
          where title like '%Visualization%'
          limit 100 
       ) as selectPapers
    WHERE `references`.paper_id = selectPapers.id OR `references`.reference_id = selectPapers.id
  ) as refPapers
Where papers.id = refPapers.paper_id
into outfile '/tmp/papers.csv' 
fields terminated by ',' 
enclosed by '"' 
lines terminated by '\n';
