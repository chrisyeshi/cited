define(function(require){
    // var timeline = require('view/timeline');
    return function() {
        var testPapers = [];
        var testReferences = [];
        var pinnedPapers = {};
        var paperSelection;
        var vis = {};
        var w = $('#vis-area').width();
        var h = $('#vis-area').height();
        var xDomain = [1990, 2015];
        var xScale = d3.scale.linear()
            .domain(xDomain)
            .range([0, w]);
        var paperBeingDragged = undefined;
        var prevMouseX, prevMouseY;
        var linkLayer;

        function paperDivWidth() {
            return $('#vis-area').width() / (xDomain[1] - xDomain[0]) * 0.9;
        }

        function getPaperById(paperId) {
            for (var i = 0; i < testPapers.length; ++i) {
                if (paperId === testPapers[i].id) {
                    return testPapers[i];
                }
            }
            return undefined;
        }

        function getPaperReferences(paperId) {
            let references = [];
            $.each(testReferences, function(index, link) {
                if (paperId === link.paper_id) {
                    let paper = getPaperById(link.reference_id);
                    if (paper)
                        references.push(paper);
                }
            });
            return references;
        }

        function getPaperCitations(paperId) {
            let citations = [];
            $.each(testReferences, function(index, link) {
                if (paperId === link.reference_id) {
                    citations.push(getPaperById(link.paper_id));
                }
            });
            return citations;
        }

        function refreshPinnedPaperView(pinnedPapers) {
            var papersByYear = [];
            $.each(pinnedPapers, function(index, paper) {
                if (!papersByYear[paper.year])
                    papersByYear[paper.year] = [];
                papersByYear[paper.year].push(paper);
            });
            $('#papers-layer').empty();
            $.each(papersByYear, function(x, papersInYear) {
                $.each(papersInYear, function(y, paper) {
                    if (!paper.position) {
                        paper.position = {
                            x: xScale(x) + paperDivWidth() * 0.05,
                            y: 80 + y * 45
                        }
                    }
                    $(document.createElement('div'))
                        .attr('class', 'paper')
                        .html(paper.year + ': ' + paper.title)
                        .css({
                            top: paper.position.y,
                            left: paper.position.x,
                            width: paperDivWidth()
                        })
                        .appendTo('#papers-layer')
                        .click(paper, function(event) {
                            let posX = $(this).position().left;
                            let widthX = $(this).width();
                            let percentX = (event.pageX - posX) / widthX;
                            let paper = event.data;
                            let paperId = paper.id;
                            let papers = [];
                            if (percentX < 0.5) {
                                $('#search-query').val('References of ' + paper.title);
                                papers = getPaperReferences(paperId);
                            } else {
                                $('#search-query').val('Citations of ' + paper.title);
                                papers = getPaperCitations(paperId);
                            }
                            populateSearchResults(papers);
                            event.stopPropagation();
                        })
                        .mousedown(paper, function(event) {
                            if (event.which == 1) {
                                paperBeingDragged = paper;
                                prevMouseX = event.pageX;
                                prevMouseY = event.pageY;
                            }
                            if (event.which == 3) {
                                delete pinnedPapers[paper.id];
                                refreshPinnedPaperView(pinnedPapers);
                            }
                        })
                })
            })
            // draw lines
            let paperIds = Object.keys(pinnedPapers);
            let paperPairs = [];
            for (let i = 0; i < paperIds.length; ++i) {
                for (let j = i + 1; j < paperIds.length; ++j) {
                    $.each(testReferences, function(index, link) {
                        if ((link.paper_id == paperIds[i] &&
                                link.reference_id == paperIds[j]) ||
                                (link.paper_id == paperIds[j] &&
                                    link.reference_id == paperIds[i])) {
                            paperPairs.push(link);
                        }
                    })
                }
            }
            linkLayer.selectAll('line').remove();
            linkLayer.selectAll('line')
                .data(paperPairs)
                .enter()
                .append('line')
                .attr('x1', function(d) {
                    return pinnedPapers[d.paper_id].position.x + paperDivWidth() * 0.95 * 0.5;
                })
                .attr('y1', function(d) {
                    return pinnedPapers[d.paper_id].position.y + 20;
                })
                .attr('x2', function(d) {
                    return pinnedPapers[d.reference_id].position.x + paperDivWidth() * 0.95 * 0.5;
                })
                .attr('y2', function(d) {
                    return pinnedPapers[d.reference_id].position.y + 20;
                });
        }

        function populateSearchResults(papers) {
            $('#search-area .results')
                .empty()
                .css('display', 'block')
            $.each(papers, function(index, paper) {
                $(document.createElement('div'))
                    .attr('class', 'item')
                    .text(paper.year + ': ' + paper.title)
                    .appendTo($('#search-area .results'))
                    .click(paper, function(e) {
                        pinnedPapers[paper.id] = paper;
                        $('#search-area .results').css('display', 'none');
                        refreshPinnedPaperView(pinnedPapers);
                    })
            })
        }

        function search(query) {
            let papers = [];
            $.each(testPapers, function(index, paper) {
                if (-1 != paper.title.search(query) || query == paper.year)
                    papers.push(paper);
            });
            populateSearchResults(papers);
        }

        window.onload = function() {
            $('#search-query')
            .css('width', 0.8 * w)
            .keyup(function(e) {
                if (13 == e.which) {
                    search(e.target.value);
                }
            })

            $('#vis-area').click(function(e) {
                $('#search-area .results').css('display', 'none');
            })
            .contextmenu(function(e) {
                e.preventDefault();
            })
            .mousemove(function(e) {
                if (paperBeingDragged) {
                    let currMouseX = e.pageX;
                    let currMouseY = e.pageY;
                    // paperBeingDragged.position.x += currMouseX - prevMouseX;
                    paperBeingDragged.position.y += currMouseY - prevMouseY;
                    refreshPinnedPaperView(pinnedPapers);
                    prevMouseX = currMouseX;
                    prevMouseY = currMouseY;
                }
            })
            .mouseup(function(e) {
                paperBeingDragged = undefined;
            })

            $.get('/references').then(function(res) {
                testReferences = res;
            })

            $.get('/papers').then(function(res) {
                testPapers = res;
            }).then(function() {
                var axis = d3.svg.axis()
                    .scale(xScale)
                    .orient('bottom')
                    .ticks(xDomain[1] - xDomain[0])
                    .tickSize(-h + 100)
                    // .outerTickSize(0)
                    // .tickPadding(10)
                vis = d3.select('#vis-area').append('svg');
                vis.attr('id', 'svg-layer')
                    .attr('width', w)
                    .attr('height', h)
                    .attr('class', 'axis');
                linkLayer = vis.append('g')
                    .attr('id', 'link-layer');
                vis.append('g')
                    .attr('transform', 'translate(0,' + (h - 30) + ')')
                    .attr('class', 'axis')
                    .call(axis);
                paperSelection = vis.append('g');
            })
        }
    }

})
