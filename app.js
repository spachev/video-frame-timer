
var FRAME_T = 1.0/29.97;
var time_offset = 0.0;

function update_time()
{
	$('#time-overlay').text((get_time() - time_offset).toFixed(2));
}

function handle_file_select(e)
{
	console.log("handle file select");
	var f = e.target.files[0];
	$('#video').attr("src", URL.createObjectURL(f));
	$('#video').bind("timeupdate", update_time);
}

function next_frame()
{
	inc_time_pos(FRAME_T);
}

function prev_frame()
{
	inc_time_pos(-FRAME_T);
}

function get_time()
{
	return $('#video').attr("currentTime");
}

function set_time(t)
{
	$('#video').attr("currentTime", t);
}

function inc_time_pos(dt)
{
	set_time(get_time() + dt);
}

function show_status(msg)
{
	$('#status').text(msg);
}

function start_time()
{
	time_offset = get_time();
	update_time();
}

var video_container = new Vue({
	el: '#video-container',
	data: {
		overlay_buttons: [
			{id: "prev-frame", cb: prev_frame, text: "<<" },
			{id: "next-frame", cb: next_frame, text: ">>"},
			{id: "start-time", cb: start_time,  text: "Start"}
		]
	},
	methods: {
		handle_click: function (b) {
			b.cb();
		}
	}
});
