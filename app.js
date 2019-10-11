
var FRAME_T = 1.0/29.97; // TODO: read frame rate from video
var time_offset = 0.0;
var container = null; // initialized later

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

function ucfirst(s)
{
	return s && s[0].toUpperCase() + s.slice(1);
}

function update_time()
{
	$('#time-overlay').text(fmt_time(get_time() - time_offset));
}

// from https://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
function parse_csv(str) {
	var arr = [];
	var quote = false;  // true means we're inside a quoted field

	// iterate over each character, keep track of current row and column (of the returned array)
	for (var col = 0, c = 0; c < str.length; c++) {
		var cc = str[c], nc = str[c+1];        // current character, next character
		arr[col] = arr[col] || '';   // create a new column (start with empty string) if necessary

		// If the current character is a quotation mark, and we're inside a
		// quoted field, and the next character is also a quotation mark,
		// add a quotation mark to the current column and skip the next character
		if (cc == '"' && quote && nc == '"') { arr[col] += cc; ++c; continue; }

		// If it's just one quotation mark, begin/end quoted field
		if (cc == '"') { quote = !quote; continue; }

		// If it's a comma and we're not in a quoted field, move on to the next column
		if (cc == ',' && !quote) { ++col; continue; }

		// If it's a newline (CRLF) and we're not in a quoted field, skip the next character
		// and move on to the next row and move to column 0 of that new row
		if (cc == '\r' && nc == '\n' && !quote) { break; }

		// If it's a newline (LF or CR) and we're not in a quoted field,
		// move on to the next row and move to column 0 of that new row
		if ((cc == '\n' || cc == '\r') && !quote) { break; }

		// Otherwise, append the current character to the current column
		arr[col] += cc;
	}
	return arr;
}

function arr_to_csv_row(arr)
{
	return arr.map(function (col) {
		if (typeof col !== "string")
			return '""';
		return '"' + col.replace("\\", "").replace(/\"/g, '""') + '"';
	}).join(',') + "\r\n";
}

function get_time()
{
	return document.getElementById('video').currentTime;
}

function set_time(t)
{
	document.getElementById('video').currentTime = t;
}

function is_time(f)
{
	return f == "time";
}

function inc_time_pos(dt)
{
	set_time(get_time() + dt);
}

function show_status(msg)
{
	$('#status').text(msg);
}

function show_error(msg)
{
	$('#error').text(msg);
}

function parse_time(t_str)
{
	var parts = t_str.split(":");
	var t = 0;
	for (var i = 0; i < parts.length; i++)
	{
		var n = parseFloat(parts[i]);
		if (n === NaN)
			return NaN;
		t = t * 60 + n;
	}
	return t;
}

window.onload = function () {
	Vue.component('vue-bootstrap-typeahead', VueBootstrapTypeahead);
	container = new Vue({
		el: '#container',
		data: {
			req_fields: ["name", "age", "gender"],
			opt_fields: ["time"],
			all_fields: null,
			current_participant_name: 'Sasha',
			overlay_buttons: [
				{id: "prev-frame", text: "<<" },
				{id: "next-frame", text: ">>"},
				{id: "start-time", text: "Start"},
				{id: "record-time", text: "Time"},
			],
			file_inputs: [
				{id: "video-file", prompt: "Load Video"},
				{id: "participant-file", prompt: "Load Participants"}
			],
			participants: [],
			current_participant: null
		},
		methods: {
			handle_click: function (b) {
				var cb_name = b.id.replace("-", "_");
				this[cb_name]();
			},
			handle_file_select: function (f, event) {
				var cb_name = "handle_" + f.id.replace("-", "_") + "_select";
				this[cb_name](event);
			},
			handle_video_file_select: function (e)
			{
				if (e.target.files.length <= 0)
					return;
				var f = e.target.files[0];
				$('#video').attr("src", URL.createObjectURL(f));
				$('#video').bind("timeupdate", update_time);
			},
			handle_participant_file_select: function (e)
			{
				if (e.target.files.length <= 0)
					return;
				var f = e.target.files[0];
				var reader = new FileReader();
				reader.onload = function (read_e) {
					container.init_participants(read_e.target.result);
				}
				reader.readAsText(f);
			},
			fmt_field: function(f, val)
			{
				return (is_time(f) && val) ? val.fmt_t : val;
			},
			handle_export: function () {
				var vm = this;
				var export_line = vm.all_fields.map(ucfirst) + "\r\n";
				var data = export_line;
				for (var i = 0; i < vm.participants.length; i++)
				{
					var arr = vm.all_fields.map(function (f) {
						return vm.fmt_field(f, vm.participants[i][f]);
					});
					data += arr_to_csv_row(arr);
				}

				var el_a = document.createElement('a');
				var data_b = new Blob([data]);
				el_a.href = URL.createObjectURL(data_b, {type: "text/csv"});
				el_a.download = "participants.csv";
				document.body.append(el_a);
				el_a.click();
				el_a.remove();
				URL.revokeObjectURL(el_a.href);
			},
			next_frame: function () {
				inc_time_pos(FRAME_T);
			},
			prev_frame:function () {
				inc_time_pos(-FRAME_T);
			},
			start_time: function () {
				time_offset = get_time();
				update_time();
			},
			goto_time: function (t_str) {
				var t = parse_time(t_str);
				if (t === NaN)
					return;
				set_time(t + time_offset);
				update_time();
			},
			record_time: function() {
				var t = get_time() - time_offset;
				var t_o = {t:t, fmt_t: fmt_time(t)};
				var vm = this;
				if (!vm.current_participant)
					return;
				vm.current_participant.time = t_o;
				vm.sort_participants();
				vm.current_participant_name = '';
			},
			sort_participants: function () {
				this.participants.sort(function (a,b) {
					if (!a.time && b.time) return 1;
					if (a.time && !b.time) return -1;
					if (!a.time && !b.time) return 0;
					return a.time.t - b.time.t;
				});
			},
			update_field_map: function (field_map, header, fields, is_req) {
				for (var i = 0; i < fields.length; i++)
				{
					var pos = header.indexOf(fields[i]);
					if (is_req && !(pos >= 0))
					{
						show_error("Missing required field " + req_fields[i]);
						return;
					}

					field_map[fields[i]] = pos;
				}
			},
			init_participants: function (data) {
				var vm = this;
				var lines = data.split(/\n|\r\n/);
				var header = parse_csv(lines[0].toLowerCase());
				var field_map = {};

				vm.all_fields = vm.req_fields.concat(vm.opt_fields);
				vm.update_field_map(field_map, header, vm.req_fields, true);
				vm.update_field_map(field_map, header, vm.opt_fields, false);
				vm.participants = [];

				for (var i = 1; i < lines.length; i++)
				{
					var line_data = parse_csv(lines[i]);

					if (!line_data || !line_data[field_map.name])
						continue;

					var o = {};

					for (var j = 0; j < vm.all_fields.length; j++)
					{
						var f = vm.all_fields[j];
						var v = line_data[field_map[f]];
						if (f == "time" && v)
							v = {t: parse_time(v), fmt_t: v};
						o[f] = v;
					}

					vm.participants.push(o);
				}
			},
			set_current_participant: function (p) {
				this.current_participant = p;
			}
		}
	});
}
