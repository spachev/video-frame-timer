
var FRAME_T = 1.0/29.97;
var time_offset = 0.0;

function fmt_time(t)
{
	var ss, mm, hh;
	var sign = "";

	if (t < 0)
	{
		sign = "-";
		t = -t;
	}

	ss = t % 60;
	t -= ss;
	ss = ss.toFixed(2);
	t = Math.round(t);
	t /= 60;
	mm = t % 60;
	t -= mm;
	t /= 60;
	hh = Math.round(t);
	var res_arr = [];
	if (hh)
		res_arr.push(hh);
	res_arr.push(mm);
	res_arr.push(ss);
	return sign + res_arr.map(function (t) {
		if (t < 10) t = "0" + t; return t;}).join(":");
}

function update_time()
{
	$('#time-overlay').text(fmt_time(get_time() - time_offset));
}

function handle_file_select(e)
{
	console.log("handle file select");
	var f = e.target.files[0];
	$('#video').attr("src", URL.createObjectURL(f));
	$('#video').bind("timeupdate", update_time);
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

window.onload = function () {
	var container = new Vue({
		el: '#container',
		data: {
			overlay_buttons: [
				{id: "prev-frame", text: "<<" },
				{id: "next-frame", text: ">>"},
				{id: "start-time", text: "Start"},
				{id: "record-time", text: "Time"},
			],
			times: []
		},
		methods: {
			handle_click: function (b) {
				var cb_name = b.id.replace("-", "_");
				this[cb_name]();
			},
			next_frame: function ()
			{
				inc_time_pos(FRAME_T);
			},
			prev_frame:function ()
			{
				inc_time_pos(-FRAME_T);
			},
			start_time: function ()
			{
				time_offset = get_time();
				update_time();
			},
			record_time: function()
			{
				var t = get_time() - time_offset;
				var t_o = {t:t, fmt_t: fmt_time(t)};
				var vm = this;
				vm.times.push(t_o);
			}

		}
	});
}
