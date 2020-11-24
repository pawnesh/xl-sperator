var CSVToArray = function() {

    this.parseCSV = function(file,callBack) {
      var reader = new FileReader();
      $('.loader').show();
      reader.onload = function(e) {
        var data = reader.result;
        callBack(data);
        $('.loader').hide();
      };

      reader.onerror = function(ex) {
        console.log(ex);
      };

      reader.readAsText(file);
    };
};

function handleFileSelect(evt) {
  
  var files = evt.target.files; // FileList object
  var xl2json = new CSVToArray();
  xl2json.parseCSV(files[0],handleFileRead);
}

var rows = null;
var noOfCols = 0;
var selectedHeaderIndex = null;
var table = $('#platform');
var seperationColoumnIndex = null;
var sumColoumnIndexes = [];

function handleFileRead(data){
  rows = textToRow(data);
  drawTable();
}

function drawTable(){
  for(var rowIndex=0;rowIndex<=rows.length;rowIndex++){
    drawRow(rowIndex,rows[rowIndex]);
  }
}

function drawRow(rowIndex, row){
  if(typeof row === 'undefined'){
    return;
  }
  if(noOfCols < row.length){
    noOfCols = row.length;
  }

  var html = '<tr data-row="'+rowIndex+'" onclick="setHeader('+rowIndex+',this)">';
  for(var index=0;index<row.length;index++){
    html = html + '<td data-col="'+index+'">'+row[index]+'</td>';
  }
  html = html + '</tr>';
  $(table).append(html);
}

function setHeader(headerIndex,headerElement){
  if(selectedHeaderIndex != null){
    alert('You may have to refresh to set header');
    return;
  }
  // refreshing
  $('.loader').show();
  $('.headerColoumn').remove();
  selectedHeaderIndex = headerIndex;

  var html = '<tr class="headerColoumn">';
  var option = '<option value="">-</option>';
  option = option + '<option value="seprate">Seperate</option>';
  option = option + '<option value="sum">Sum</option>';
  for(var i=0;i<noOfCols;i++){
    html = html + '<td><select id="option_'+headerIndex+'_'+i+'">'+option+'</select></td>';
  }
  html = html + '</tr>';
  $(headerElement).before(html);
  $('.loader').hide();
}

function textToRow(data){
  var rowsLocal = data.split(/\r\n|\n/);
  for(var i=0;i<rowsLocal.length;i++){
    rowsLocal[i] = rowsLocal[i].split(',');
  }
  return rowsLocal;
}

function processesData(){
  var processedData = [];
  var headerData = [];
  // find the seperation Coloum index
  var tds = $('.headerColoumn td select');
  for(var colIndex=0; colIndex<= tds.length; colIndex++){
      if($(tds[colIndex]).val() == 'seprate'){
        seperationColoumnIndex = colIndex;
      }

      if($(tds[colIndex]).val() == 'sum'){
        sumColoumnIndexes.push(colIndex);
      }
  }

  if(seperationColoumnIndex == null){
    alert('could not process as you have not selected the coloumn which can be used as key');
    return;
  }
  
  for(var rowIndex=0;rowIndex<rows.length;rowIndex++){
    var row = [];
    // preparing a plain row with the data
    for(var colIndex = 0; colIndex < noOfCols; colIndex++){
      if(typeof  rows[rowIndex][colIndex]  == 'undefined'){
        rows[rowIndex][colIndex] = '';
      }
      row[colIndex] = rows[rowIndex][colIndex];
    }
    // put it in header section if it is above the selected row
    if(rowIndex <= selectedHeaderIndex){
      headerData.push(row);
      continue;
    }
    
    if(rowIndex > selectedHeaderIndex){
      if(rows[rowIndex][seperationColoumnIndex] == ''){
        continue;
      }
      if(typeof processedData[rows[rowIndex][seperationColoumnIndex]] == 'undefined'){
        processedData[rows[rowIndex][seperationColoumnIndex]] = [];
      }
      processedData[rows[rowIndex][seperationColoumnIndex]].push(row);
    }
  }
  processedData = applySumOnColoumn(processedData);
  downloadCSV(headerData,processedData);
}

function applySumOnColoumn(processedData){
  var rowsContaintingTotal = null;
  // adding last row for total in individual sheet
  for(var key in processedData){
    rowsContaintingTotal = [];
    for(var i=0;i<noOfCols;i++){
      rowsContaintingTotal[i] = '';
    }
    rowsContaintingTotal[0] = 'Total';
    processedData[key].push(rowsContaintingTotal);
  }
  // summing based on coloumn
  sumColoumnIndexes.forEach(function(sumColoumnIndex){

    for(var key in processedData){
      var lastRowIndex = processedData[key].length -1;
      var lastRow = processedData[key][lastRowIndex];
      for(var i=0;i< lastRowIndex;i++){
        if(lastRow[sumColoumnIndex] == ''){
          lastRow[sumColoumnIndex] = 0;
        }
        if(parseInt(processedData[key][i][sumColoumnIndex])){
          lastRow[sumColoumnIndex] = lastRow[sumColoumnIndex] + parseInt(processedData[key][i][sumColoumnIndex]);
        }
      }
    }
    
  });
  return processedData;
}

var downloadLinks = [];
function downloadCSV(headerData,processedData){
  var header = [];
  for(var i=0; i< headerData.length;i++){
    header.push(headerData[i].join(','));
  }
  header = header.join('\n');

  for(key in processedData){
      var text = [];
      for(var rowIndex=0;rowIndex<processedData[key].length;rowIndex++){
        text.push(processedData[key][rowIndex].join(','));
      }
      text = header+'\r\n'+text.join('\n');
      var downloadLink = document.createElement("a");
      var blob = new Blob(["\ufeff", text]);
      var url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.className = 'download-link';
      downloadLink.target = '_blank';
      downloadLink.download = key+".csv";
      downloadLink.innerHTML = key;

      $('#link').append(downloadLink);
      downloadLinks.push(downloadLink);
  }
  var downloadLink = document.createElement("a");
  downloadLink.innerHTML = 'Download All';
  downloadLink.href = '#';
  downloadLink.onclick = function(){
    downloadLinks.forEach(function(el){
      el.click();
    });
  }
  $('#link').append(downloadLink);
}

document.getElementById('upload').addEventListener('change', handleFileSelect, false);
$('#process-it').click(function(){
  processesData();
});

$(document).ready(function(){
  $('.loader').hide();
});