var symbols = '<>+-[]';
var tape = [];
var data = [];
var pointer = 0;
var head = 0;
var endedWell = false;
var waitTicks = 0;

var running = false;
var stepmode = 0;
var stepSpeed = 50;
var scrollSpeed = stepSpeed*3;
var inc = 0;
var maxWaitTicks = 5;

$(function() {

	function newSymbol() {
		return $('<span tabindex=1 class="symbol">&nbsp;</span>');
	}
	function newData() {
		return $('<span class="data"/>');
	}

	function setTape(i,symbol) {
		switch(i) {
			case -1:
				tape.unshift(symbol);
				$(newSymbol()).insertAfter('#tape .start');
				break;
			case tape.length:
				tape.push(symbol);
				$(newSymbol()).insertBefore('#tape .end');
				break;
			default:
				tape[i] = symbol;
		}

		var program = tape.join('');
		var uri = encodeURI(program.replace(/[\[\]<>]/g,function(s){return 'bBpP'['[]<>'.indexOf(s)]}));
		history.replaceState({},document.title,location.pathname+'?'+uri);
		$('#link').attr('href',location.href);
	}

	function loadProgram(program) {
		program = program.replace(/[pPbB]/g,function(s){ return '<>[]'['pPbB'.indexOf(s)]});
		for(var i=0;i<program.length;i++) {
			setTape(i,program[i]);
			$('.symbol').eq(i).text(program[i]);
		}
	}

	function setData(i,v) {
		switch(i) {
			case -1:
				data.splice(0,0,v);
				$('#memory').prepend(newData());
				pointer+=1;
				i = 0;
				break;
			case data.length:
				data.push(v);
				$('#memory').append(newData());
				break;
			default:
				data[i] = v;
		}
		$('#memory .data').eq(i).text(v);
	}
	function movePointerTo(i) {
		pointer = i;
		if(pointer==data.length)
			setData(pointer,0);
		if(pointer==-1)
			setData(-1,0);
		$('.data').removeClass('pointer').eq(pointer).addClass('pointer');
	}
	function incrementPointer() {
		movePointerTo(pointer+1);
	}
	function decrementPointer() {
		movePointerTo(pointer-1);
	}
	function incrementData() {
		setData(pointer,data[pointer]+1);
	}
	function decrementData() {
		setData(pointer,data[pointer]-1);
	}
	function ifLeft() {
		if(data[pointer]==0) {
			inc = 1;
		}
	}
	function ifRight() {
		if(data[pointer]!=0) {
			inc = -1;
		}
	}

	function moveHeadTo(i) {
		head = i;
		$('.symbol').removeClass('head').eq(i).addClass('head');
		scrollToSymbol(head);
	}
	function incrementHead() {
		moveHeadTo(head+1);
	}
	function decrementHead() {
		moveHeadTo(head-1);
	}

	var ops = {
		'>': incrementPointer,
		'<': decrementPointer,
		'+': incrementData,
		'-': decrementData,
		'[': ifLeft,
		']': ifRight
	}

	function reset() {
		endedWell = false;
		waitTicks = maxWaitTicks;
		head = 0;
		pointer = 0;
		data = [];
		$('.data').remove();
		setData(0,0);
		movePointerTo(0);
		moveHeadTo(0);
		running = false;
		stepmode = 1;
		inc = 0;
		$('.head,.pointer').removeClass('head,pointer');
	}

	if(location.search) {
		loadProgram(location.search.slice(1));
	}
	setTape(tape.length,'');
	reset();

	setInterval(step,stepSpeed);

	function step() {
		if(!running)
			return;
		if(!tape[head]) {
			endedWell = true;
			stop();
			return;
		}
		if(waitTicks) {
			waitTicks--;
			return;
		}
		if(inc==0) {
			stepmode = 1-stepmode;
			if(stepmode) {
				incrementHead();
				waitTicks = maxWaitTicks;
			}
			else {
				var op = tape[head];
				if(op)
					ops[op]();
				waitTicks = maxWaitTicks;
			}
		}
		else {
			inc<0 ? decrementHead() : incrementHead();
			if(tape[head]=='[')
				inc++;
			else if(tape[head]==']')
				inc--;
			if(inc==0)
				waitTicks = maxWaitTicks;
		}
	}

	function run() {
		if(endedWell) {
			reset();
		}
		$('#reset').attr('disabled',true);
		running = true;
		$('#go').hide();
		$('#stop').show();
	}
	function stop() {
		running = false;
		$('#reset').attr('disabled',false);
		$('#go').show();
		$('#stop').hide();
	}

	/// jquery stuff
	//
	function scrollToSymbol(i) {
		var left = $('#tape .symbol').eq(i).position().left - $('#tape').position().left;;
		$('#tape').parent().stop().animate({scrollLeft:left-300},scrollSpeed);
	}
	
	$('#tape').on('focus','.start',function() {
		$('.symbol:first').focus();
	});
	$('#tape').on('focus','.end',function() {
		setTape(tape.length,'');
		$(this).prev().focus();
	});

	$('#tape').on('keydown','.symbol',function(e) {
		switch(e.which) {
			case 37: //left
				$(this).prev().focus();
				break;
			case 39: //right
				$(this).next().focus();
				break;
			case 8:  //backspace
				e.preventDefault();
				var i = $(this).index()-1;
				if(i==0)
					return;
				tape.splice(i-1,1);
				$(this).prev().remove();
			case 46: //delete
				var i = $(this).index()-1;
				tape.splice(i,1);
				$(this).next().focus();
				$(this).remove();
				if(tape.length==1)
					$('.symbol').focus();
				e.preventDefault();
		}
	});
	$('#tape').on('keypress','.symbol',function(e) {
		e.preventDefault();
		var c = String.fromCharCode(e.which).toUpperCase();
		if(symbols.indexOf(c)==-1)
			return;
		var i = $(this).index()-1;
		var s = newSymbol();
		s.text(c);
		s.insertBefore(this);
		tape.splice(i,0,c);
		setTape(i,c);
	});
	$('#go').on('click',function() {
		run();
	});
	$('#stop').on('click',function() {
		stop();
	});
	$('#reset').on('click',function() {
		reset();
	});
	$('#speed input').val(20-maxWaitTicks);
	$('#speed input').on('change',function() {
		maxWaitTicks = 20 - $(this).val();
	});
});
