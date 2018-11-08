use academic_graph;
-- SELECT id FROM journals WHERE `name` REGEXP 'ieee|acm|computer|computing|software|information';
-- SELECT id FROM journals WHERE `name` LIKE 'nature%';
-- SELECT id FROM journals WHERE `name` LIKE 'science%';
SELECT id FROM conferences WHERE `fullname` REGEXP 'ieee|acm|computer|computing|software|information';

