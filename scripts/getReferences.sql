use academic_graph;
SELECT paper_id, reference_id from `references`,
       (
          select * from papers 
          where title like '%Visualization%'
          limit 100 
       ) as selectPapers
WHERE `references`.paper_id = selectPapers.id OR `references`.reference_id = selectPapers.id
into outfile '/tmp/reference.csv' 
fields terminated by ',' 
enclosed by '"' 
lines terminated by '\n';
