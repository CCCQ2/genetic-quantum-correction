/*jslint todo:true, devel:true, nomen: true */
/* global $, document, _*/
//------------------------------------------------------------------------------
// QUANTUM ERROR CORRECTION CODE
//------------------------------------------------------------------------------
// INPUT: A 8*8 grid of values or game over
// OUTPUT: A list of 10 numbers describing grid movements

// Game mechanics
// TODO: Implement game vs puzzle mode
// TODO: Implement cluster solving cost
// TODO: Create a cluster and a cell class
// TODO: Disable noise generation for puzzle solving
// TODO: Implement secs for noise generation
// TODO: Implement TDD
// TODO: Implement an auto replay feature
// Display
// TODO: Prune null cluster to free css color classes
// TODO: redisplay using threeJS
// AI
// TODO: Tensor strength is distance to other cluster
// TODO: Implement divide and conquer strategy
// TODO: Reformulate problem to be genetic algorithm compatible
// TODO: Consider puzzle as a collapsing graph
// TODO: Implement a js eval textarea field where you can test your AI
// TODO: Score grid on the number of adjacent cells
// TODO: Use genetic algorithm to guide towards best solving patterns
// TODO: Generate training data for AI
// Network
// TODO: Migrate the error generation part to avoid cheating
// TODO: Create a highscore chart


// GLOBAL VARIABLES
var gridSize = 8;
var secs = 0;
var d = 10;
var clusterNum = 0;
var type = "Number";
var errorRate = 5;

// INITIALIZE CLUSTERS & ANYONS ARRAY
var anyons = [];
var computeGrid = [];
var clusters = [];
var clusterList = [];

// PUZZLES
var puzzles = [
    "6003907404044709030003000700000004550000064037642865550000000582",
    "1200072807000300460030008700770005839300046000550440091206600134",
    "6601200008070191906000011540020805006891045643009954075008000005",
    "0000000000337019007730005808264007006055073040003375509070055092",
    "2727805051332053000009973100411079406730006000001903780700000203",
    "7300700100003027600000194064004003730024070000462856827301440091",
    "9530005368910057028960000300400907000371000028054003900560071631",
    "6608200008000082002419030081000701037640094236090060846600084045",
    "5820002054646005000000867373009000911900820009000914012800060037",
    "2170835507040902030658006400502073195880010078237900016130071119"
];


//------------------------GAME LOGIC--------------------------------------------
// RESET CLUSTER GRID AND ANYONS
function resetAnyons() {
    "use strict";
    var i, x, y;
    for (i = 0; i <= secs; i += 1) {
        anyons[i] = [];
        for (x = 0; x < gridSize; x += 1) {
            anyons[i][x] = [];
            clusters[x] = [];
            computeGrid[x] = [];
            for (y = 0; y < gridSize; y += 1) {
                anyons[i][x][y] = 0;
                clusters[x][y] = 0;
                computeGrid[x][y] = 0;
            }
        }
    }
}


// LOAD ANYONS
function loadAnyons(anyonsString) {
    "use strict";
    var x, y, total;
    total = 0;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            anyons[secs][y][x] = parseInt(anyonsString[y * gridSize + x], 10);
            total += parseInt(anyons[secs][y][x], 10);
        }
    }
    if (total % d !== 0) {
        alert("Inconsistent problem error");
    }
}


// SAVE ANYONS
function saveAnyons() {
    "use strict";
    var x, y, anyonsString;
    anyonsString = "";
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            anyonsString += anyons[secs][y][x];
        }
    }
    return anyonsString;
}


// GENERATE NOISE
function generateError() {
    "use strict";
    var x1, y1, x2, y2, r, a, aa, num, clusterOld, x, y;
    // Pick a random square
    x1 = Math.floor(Math.random() * gridSize);
    y1 = Math.floor(Math.random() * gridSize);
    r = 2 * (Math.floor(Math.random() * 100) % 2) - 1;
    a = Math.floor(Math.random() * 9) + 1;
    aa = 10 - a;
    num = 0;

    // Random neighbour
    if (Math.random() < 0.5) {
        if (x1 === 0 || x1 === gridSize - 1) {
            x2 = x1 + (x1 === 0) - (x1 === (gridSize - 1));
        } else {
            x2 = x1 + r;
        }
        y2 = y1;
    } else {
        x2 = x1;
        if (y1 === 0 || y1 === gridSize - 1) {
            y2 = y1 + (y1 === 0) - (y1 === (gridSize - 1));
        } else {
            y2 = y1 + r;
        }
    }

    //console.log("Error 1: [" + x1 + ", " + y1 + "][" + a  + "][" + anyons[secs][x1][y1] + "]");
    //console.log("Error 2: [" + x2 + ", " + y2 + "][" + aa + "][" + anyons[secs][x2][y2] + "]");

    // Add new error to new cluster
    if (anyons[secs][x1][y1] === 0 && anyons[secs][x2][y2] === 0) {
        anyons[secs][x1][y1] = a;
        anyons[secs][x2][y2] = aa;
        clusterNum += 1;
        clusters[x1][y1] = clusterNum;
        clusters[x2][y2] = clusterNum;
        num += 1;

        // Add new error to existing cluster
    } else if (anyons[secs][x1][y1] === 0 && anyons[secs][x2][y2] > 0) {
        anyons[secs][x1][y1] = (a + anyons[secs][x1][y1]) % d;
        anyons[secs][x2][y2] = (aa + anyons[secs][x2][y2]) % d;
        clusters[x1][y1] = clusters[x2][y2];
        if (anyons[secs][x2][y2] === 0) {
            clusters[x2][y2] = 0;
        }
        num += 1;

    } else if (anyons[secs][x1][y1] > 0 && anyons[secs][x2][y2] === 0) {
        anyons[secs][x1][y1] = (a + anyons[secs][x1][y1]) % d;
        anyons[secs][x2][y2] = (aa + anyons[secs][x2][y2]) % d;
        clusters[x2][y2] = clusters[x1][y1];
        if (anyons[secs][x1][y1] === 0) {
            clusters[x1][y1] = 0;
        }
        num += 1;

        // Merge with existing cluster or merge clusters
    } else if (anyons[secs][x1][y1] > 0 && anyons[secs][x2][y2] > 0) {
        clusterOld = clusters[x2][y2];
        for (y = 0; y < gridSize; y += 1) {
            for (x = 0; x < gridSize; x += 1) {
                if (clusters[x][y] === clusterOld) {
                    clusters[x][y] = clusters[x1][y1];
                }
            }
        }
        anyons[secs][x1][y1] = (a + anyons[secs][x1][y1]) % d;
        anyons[secs][x2][y2] = (aa + anyons[secs][x2][y2]) % d;
        if (anyons[secs][x1][y1] === 0) {
            clusters[x1][y1] = 0;
        }
        if (anyons[secs][x2][y2] === 0) {
            clusters[x2][y2] = 0;
        }
        // these are counted less towards num
        num += 0.1;
    }
    return [x1, y1, x2, y2, num];
}


// GENERATE NOISE
function generateNoise() {
    "use strict";
    var num, errorList, error;
    num = 0;
    errorList = [];
    while (num < 6) {
        error = generateError();
        errorList.push(error[0], error[1], error[2], error[3]);
        num += error[4];
    }
    return errorList;
}


// CHECK SPANNERS
function checkSpanners() {
    "use strict";
    var spanners, x, y;
    spanners = 0;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            spanners += (clusters[x][0] === clusters[y][gridSize - 1]) * clusters[x][0];
            spanners += (clusters[0][x] === clusters[gridSize - 1][y]) * clusters[0][x];
        }
    }
    if (spanners > 0) {
        return true;
    }
}


// COUNT ANYONS
function countAnyons() {
    "use strict";
    var count, x, y;
    count = 0;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            if (anyons[secs][x][y] !== 0) {
                count += 1;
            }
        }
    }
    return count;
}


// COUNT MOVES
function countMoves() {
    "use strict";
    var x, y;
    secs += 1;
    // generate new secs array
    anyons[secs] = [];
    for (x = 0; x < gridSize; x += 1) {
        anyons[secs][x] = [];
        for (y = 0; y < gridSize; y += 1) {
            anyons[secs][x][y] = 0;
        }
    }
    // save previous secs array
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            anyons[secs][x][y] = anyons[secs - 1][x][y];
        }
    }
    $("#secs").html(secs);
    return secs;
}


// MOVES
function move(x1, y1, x2, y2) {
    "use strict";
    var oldCluster, x, y, newVal;
    countMoves();

    // cluster and anyons update
    if ((anyons[secs][x2][y2] > 0) && (clusters[x2][y2] !== clusters[x1][y1]) && clusters[x1][y1] !== 0) {
        oldCluster = clusters[x1][y1];
        for (x = 0; x < gridSize; x += 1) {
            for (y = 0; y < gridSize; y += 1) {
                if (clusters[x][y] === oldCluster) {
                    clusters[x][y] = clusters[x2][y2];
                }
            }
        }
    }
    // add it to the destination
    newVal = (anyons[secs][x1][y1] + anyons[secs][x2][y2]) % d;
    anyons[secs][x2][y2] = newVal;
    // carry the cluster with it, except for the case of annihilation
    if (anyons[secs][x2][y2] === 0) {
        clusters[x2][y2] = 0;
    } else {
        clusters[x2][y2] = clusters[x1][y1];
    }
    // remove it from the initial position
    anyons[secs][x1][y1] = 0;
    clusters[x1][y1] = 0;

    // check for spanners
    if (checkSpanners() === true) {
        alert("GAME OVER!");

    } else {
        // empty anyons array
        if (countAnyons() === 0) {
            while ((secs % errorRate) > 0) {
                countMoves();
            }
        }
        // generate noise
        if (secs % errorRate === 0) {
            generateNoise();
        }

    }
}


//------------------------DISPLAY-----------------------------------------------
// INIT GRID
function initGrid() {
    "use strict";
    var x, y, row, rowData;
    for (y = 0; y < gridSize; y += 1) {
        row = $("<tr></tr>");
        for (x = 0; x < gridSize; x += 1) {
            rowData = $("<td></td>");
            row.append(rowData);
        }
        $("#grid tbody").append(row);
    }
}


// RESET GRID
function resetGrid() {
    "use strict";
    var x, y, cell, $cell;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            cell = $("#grid tbody")[0].rows[x].cells[y];
            $cell = $(cell);
            $cell.html(" ");
            $cell.removeClass();
        }
    }
}


// UPDATE CELL
function updateCell(x, y, val) {
    "use strict";
    var cell, $cell;
    cell = $("#grid tbody")[0].rows[x].cells[y];
    $cell = $(cell);
    if (val === 0) {
        $cell.html("");
        $cell.removeClass();
    } else {
        $cell.html(val);
        $cell.removeClass();
        $cell.addClass("group" + clusters[x][y]);
    }
}


// DRAW GRID
function displayGrid() {
    "use strict";
    var x, y;
    for (y = 0; y < gridSize; y += 1) {
        for (x = 0; x < gridSize; x += 1) {
            switch (type) {
            case "Number":
                updateCell(x, y, anyons[secs][x][y]);
                break;
            case "Phi":
                if (anyons[secs][x][y] === 5) {
                    updateCell(x, y, "V");
                } else {
                    updateCell(x, y, "#");
                }
                break;
            case "Cluster":
                updateCell(x, y, clusters[x][y]);
                break;
            }
        }
    }
}


// HIGHLIGHT CELLS
function highlightCells(cells) {
    "use strict";
    var i, x, y, cell, $cell;
    for (i = 0; i < cells.length; i += 1) {
        x = cells[i][0];
        y = cells[i][1];
        cell = $("#grid tbody")[0].rows[x].cells[y];
        $cell = $(cell);
        $cell.toggleClass("highlight");
    }
}


// DISPLAY CLUSTER GRID
function displayClusterGrid() {
    "use strict";
    var x, y, row, rowData;
    $("#clusterGrid tbody").empty();
    for (x = 0; x < gridSize; x += 1) {
        row = $("<tr></tr>");
        for (y = 0; y < gridSize; y += 1) {
            if (clusters[x][y] === 0) {
                rowData = $("<td></td>");
            } else {
                rowData = $("<td>" + clusters[x][y] + "</td>");
            }
            row.append(rowData);
        }
        $("#clusterGrid tbody").append(row);
    }
}


//------------------------HELPERS-----------------------------------------------
//LIST ALL CELLS
function listCells() {
    "use strict";
    var x, y, cells;
    cells = [];
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            if (anyons[secs][x][y] !== 0) {
                cells.push([x, y]);
            }
        }
    }
    return cells;
}


// GET ADJACENT CELLS
function adjacentCells(x, y) {
    "use strict";
    var cells, fullCells, i;
    cells = [];
    fullCells = [];
    // get up
    if (x > 0) {
        cells.push([x - 1, y]);
    }
    // get down
    if (x < gridSize - 1) {
        cells.push([x + 1, y]);
    }
    // get left
    if (y > 0) {
        cells.push([x, y - 1]);
    }
    // get right
    if (y < gridSize - 1) {
        cells.push([x, y + 1]);
    }
    for (i = 0; i < cells.length; i += 1) {
        if (anyons[secs][cells[i][0]][cells[i][1]] !== 0) {
            fullCells.push(cells[i]);
        }
    }
    return fullCells;
}


// CONTAINS COORD
function containsCoords(x, y, array) {
    "use strict";
    var i;
    for (i = 0; i < array.length; i += 1) {
        if (array[i][0] === x && array[i][1] === y) {
            return true;
        }
    }
    return false;
}


// GET ADJACENT CLUSTER
function adjacentCluster(x, y) {
    "use strict";
    var cluster, queue, current, cells, i;
    cluster = [];
    cells = [];
    if (anyons[secs][x][y] !== 0) {
        queue = [
            [x, y]
        ];
        // until queue is empty
        while (queue.length > 0) {
            // get last item in queue
            current = queue.pop();
            // save it in painted cluster
            cluster.push(current);
            // get adjacent cells
            cells = adjacentCells(current[0], current[1]);
            for (i = 0; i < cells.length; i += 1) {
                if (containsCoords(cells[i][0], cells[i][1], queue) === false && containsCoords(cells[i][0], cells[i][1], cluster) === false) {
                    queue.push(cells[i]);
                }
            }
        }
    }
    return cluster;
}


// CLUSTER VALIDITY REMAINS
function clusterRemain(cluster) {
    "use strict";
    var i, total;
    total = 0;
    for (i = 0; i < cluster.length; i += 1) {
        total += anyons[secs][cluster[i][0]][cluster[i][1]];
    }
    return total % d;
}


// DISTANCE BETWEEN CELLS
function distance(cell1, cell2) {
    "use strict";
    return Math.abs(cell1[0] - cell2[0]) + Math.abs(cell1[1] - cell2[1]);
}


// DISTANCE FROM CLUSTER
function shortestDistance(clust1, clust2) {
    "use strict";
    var i, j, min, dist, closestCells;
    closestCells = [];
    min = gridSize * 2;
    for (i = 0; i < clust1.length; i += 1) {
        for (j = 0; j < clust2.length; j += 1) {
            dist = distance(clust1[i], clust2[j]);
            if (dist <= min) {
                min = dist;
                closestCells.push([clust1[i], clust2[j]]);
            }
        }
    }
    return closestCells;
}


// ORDERED CLUSTER LIST
function generateClusterList() {
    "use strict";
    var x, y, indexes, i;
    clusterList = [];
    indexes = [];
    // Get cluster indexes
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            if (clusters[x][y] !== 0) {
                indexes.push(clusters[x][y]);
            }
        }
    }
    indexes = _.uniq(indexes);
    // Populate clusters
    for (i = 0; i < indexes.length; i += 1) {
        clusterList[i] = [];
        for (x = 0; x < gridSize; x += 1) {
            for (y = 0; y < gridSize; y += 1) {
                if (clusters[x][y] === indexes[i]) {
                    clusterList[i].push([x, y]);
                }
            }
        }
    }
    clusterList.sort(function(a, b) {
        return b.length - a.length;
    });
    return clusterList;
}


// COMPARE HISTORICAL ANYONS ARRAY
function anyonsDifference() {
    "use strict";
    var diffGrid, x, y;
    diffGrid = [];
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            if (anyons[secs][x][y] !== anyons[secs - 1][x][y]) {
                diffGrid.push([x, y]);
            }
        }
    }
    //console.log(diffGrid);
    return diffGrid;
}


//------------------------CONTROLS----------------------------------------------
// CLUSTER THREAT LEVEL
function threatLevel(cluster) {
    "use strict";
    var threatX, threatY;
    cluster.sort(function(a, b) {
        return a[0] - b[0];
    });
    threatX = cluster[cluster.length - 1][0] - cluster[0][0];
    cluster.sort(function(a, b) {
        return a[1] - b[1];
    });
    threatY = cluster[cluster.length - 1][1] - cluster[0][1];
    return threatX + threatY;
}


// DISPLAY CLUSTERS
function displayClusters() {
    "use strict";
    var x, row, clusterList;
    clusterList = findContiguousClusters();
    $("#clusters tbody").empty();
    for (x = 0; x < clusterList.length; x += 1) {
        row = "";
        row += "<tr>";
        row += "<td>" + (x + 1) + "</td>";
        row += "<td>" + clusterList[x].length + "</td>";
        row += "<td>" + clusterRemain(clusterList[x]) + "</td>";
        row += "<td>" + adjacentScore(clusterList[x]) + "</td>";
        row += "<td>" + threatLevel(clusterList[x]) + "</td>";
        row += "<td>" + clusterList[x].toString() + "</td>";
        row += "</tr>";
        $("#clusters tbody").append(row);
    }
}


//------------------------AI----------------------------------------------------
// SEGMENT CLUSTER
// doesn't take in account diagonal cluster before starting the move
// if cluster neighbour cancel each other remove them from the cluster
// reduce search space to avoid expensive computation
// remove cells that are sure

// DIFFERENCE BETWEEN CLUSTERS
function differenceCluster(clust1, clust2) {
    "use strict";
    var i, j, cell1, cell2;
    for (i = clust1.length - 1; i >= 0; i -= 1) {
        cell1 = clust1[i];
        for (j = 0; j < clust2.length; j += 1) {
            cell2 = clust2[j];
            if (cell1[0] === cell2[0] && cell1[1] === cell2[1]) {
                clust1.splice(i, 1);
            }
        }
    }
    return clust1;
}


// ADJACENT MATCH
function adjacentMatch(cell) {
    "use strict";
    var cells, matches, value1, value2;
    matches = [];
    cells = adjacentCells(cell[0], cell[1]);
    for (var i = 0; i < cells.length; i++) {
        value1 = anyons[secs][cell[0]][cell[1]];
        value2 = anyons[secs][cells[i][0]][cells[i][1]];
        if ((value1 + value2) % d === 0) {
            matches.push(cells[i]);
        }
    }
    return matches;
}


// CLUSTER ADJACENCY SCORE
function adjacentScore(cluster) {
    "use strict";
    var i, score;
    score = 0;
    for (i = 0; i < cluster.length; i++) {
        score += adjacentCells(cluster[i][0], cluster[i][1]).length;
    }
    return score;
}

// CLUSTER VALID MATCHES (DIVIDE AND CONQUER)
// when a cluster is split into many valid clusters by a collapse
// rank cluster cells by number of adjacent cells
function validMatches(cluster) {
    "use strict";
    var validCollapse, matches, testGrid;
    validCollapse = [];

    for (var i = 0; i < cluster.length; i++) {
        // find cluster matches
        matches = adjacentMatch(cluster[i]);
        for (var i = 0; i < matches.length; i++) {
            // simulate output of matches in cluster validity
            if (matches[i] + cluster[i]){
                // rank output
            }
        }
    }
    return validCollapse;
}

// CLUSTER SOLVE
// minimal number of moves to solve the valid cluster
function clusterSolve(cluster) {
    "use strict";
    var moves, i;
    moves = [];
    //for (i = 0; i < cluster.length; i += 1) {
    //  cluster[i]
    //}
    // find matches that reduce the search space
    return moves;
}


// FIND ALL CLUSTERS
// find and assign contiguous clusters
function findContiguousClusters() {
    "use strict";
    var queue, cluster, clusterList, cell, i, j;
    clusterList = [];
    queue = listCells();
    while (queue.length !== 0) {
        cell = queue.pop();
        cluster = adjacentCluster(cell[0], cell[1]);
        clusterList.push(cluster);
        queue = differenceCluster(queue, cluster);
    }
    // assign cluster id to clusters
    for (i = 0; i < clusterList.length; i += 1) {
        cluster = clusterList[i];
        for (j = 0; j < cluster.length; j += 1) {
            cell = cluster[j];
            clusters[cell[0]][cell[1]] = i;
        }
    }
    displayGrid();
    return clusterList;
}


// INVALID CLUSTERS
// combine invalid clusters to get valid total % d
function invalidClusters() {
    "use strict";
    var i, invalidClusters;
    invalidClusters = [];
    for (i = 0; i < clusterList.length; i += 1) {
        if (clusterRemain(clusterList[i]) !== 0){
            invalidClusters.push(clusterList[i]);
        }
    }
    return invalidClusters;
}


// SEGMENT CLUSTER
// find cells with one adjacent cell that are similar to leafs in a graph
function segmentCluster(cluster) {
    "use strict";
    var x1, y1, x2, y2, i, cells, suggestedMoves;
    suggestedMoves = [];
    for (i = 0; i < cluster.length; i += 1) {
        x1 = cluster[i][0];
        y1 = cluster[i][1];
        cells = adjacentCells(x1, y1);
        if (cells.length === 1) {
            x2 = cells[0][0];
            y2 = cells[0][1];
            if ((anyons[secs][x1][y1] + anyons[secs][x2][y2]) % d === 0) {
                suggestedMoves.push([x1, y1], [x2, y2]);
                highlightCells(suggestedMoves);
                //console.log("Found match between [" + x1 + " , " + y1 + "] and [" + x2 + " , " + y2 + "]");
            }
        }
    }
    displayGrid();
    return suggestedMoves;
}


// PRUNE CLUSTER
function pruneCluster(cluster) {
    "use strict";
    var x1, y1, x2, y2, i, edgeCells;
    edgeCells = [];

    // if cell has only one adjacent cell and their sum % d is 0
    if (cluster.lenght === 2) {
        x1 = cluster[0][0];
        y1 = cluster[0][1];
        x2 = cluster[1][0];
        y2 = cluster[1][1];
        move(x1, y1, x2, y2);

        // if 3 cells compose a cluster and their sum %d is 0
        // find center cell and move the two others towards it
    } else if (cluster.lenght === 3 && clusterRemain(cluster) === 0) {
        for (i = 0; i < cluster.length; i += 1) {
            if (adjacentCells(cluster[i][0], cluster[i][1]).length === 2) {
                x2 = cluster[i][0];
                y2 = cluster[i][1];
            } else {
                edgeCells.push(cluster[i]);
            }
            move(edgeCells[0][0], edgeCells[0][1], x2, y2);
            move(edgeCells[1][0], edgeCells[1][1], x2, y2);
        }
    }
}


//------------------------MAIN--------------------------------------------------
// NEW GAME
function newGame() {
    "use strict";
    secs = 0;
    clusterNum = 0;
    resetAnyons();
    resetGrid();
    generateNoise();
    if (checkSpanners()) {
        newGame();
    }
    displayGrid();
}


$(document).ready(function() {
    "use strict";
    var dragging, fromX, fromY, x, y, cluster, cells, puzzleNum, i;
    initGrid();
    //newGame();
    resetAnyons();
    loadAnyons(puzzles[0]);
    displayGrid();
    displayClusters();


    // Populate puzzle select
    for (i = 0; i < puzzles.length; i += 1) {
        $("#puzzles").append("<option value='" + i + "'>" + (i + 1) + "</option>");
    }

    // Player moves
    dragging = false;
    $("#grid tbody td").click(function() {
        y = parseInt($(this).index(), 10);
        x = parseInt($(this).parent().index(), 10);
        // Start move
        if (dragging === false) {
            fromX = x;
            fromY = y;
            dragging = true;
        } else if (dragging === true && fromX === x && fromY === y) {
            dragging = false;
        } else if (dragging === true && anyons[secs][fromX][fromY] !== 0 && (
                (fromX + 1 === x && fromY === y) ||
                (fromX - 1 === x && fromY === y) ||
                (fromX === x && fromY + 1 === y) ||
                (fromX === x && fromY - 1 === y)
            )) {
            move(fromX, fromY, x, y);
            dragging = false;
            displayGrid();
        } else {
            dragging = false;
        }
        displayGrid();
    });

    // Debug position
    $("#grid tbody td").hover(function() {
        y = parseInt($(this).index(), 10);
        x = parseInt($(this).parent().index(), 10);
        $("#coord").html("[" + x + ", " + y + "]");
        cluster = adjacentCluster(x, y);
        $("#cluster").html(JSON.stringify(cluster));
        if (clusterRemain(cluster) === 0) {
            $("#cluster").css("background-color", "green");
        } else {
            $("#cluster").css("background-color", "red");
        }
        if (cluster.length > 0) {
            segmentCluster(cluster);
        }
        highlightCells(cluster);
    });

    // Controls
    $("#load").click(function() {
        puzzleNum = $("#puzzles").val();
        resetAnyons();
        loadAnyons(puzzles[puzzleNum]);
        findContiguousClusters();
        displayGrid();
    });
    $("#save").click(function() {
        saveAnyons();
    });
    $("#prev").click(function() {
        if (secs > 0) {
            secs -= 1;
            $("#secs").html(secs);
            displayGrid();
        }
    });
    $("#diff").click(function() {
        cells = anyonsDifference();
        highlightCells(cells);
    });
    $("#error").click(function() {
        generateError();
        displayGrid();
    });
    $("#newgame").click(function() {
        newGame();
    });
    $("input[name='gametype']").change(function() {
        type = $(this).val();
        displayGrid();
    });
});
