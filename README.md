# <strong>TagSee  - Making RFID Research Enjoyable!</strong>



## <strong>Version</strong>

<table>
    <tr>
	    <td><strong>Version</strong></td>
    	<td><strong>Description</strong></td>
        <td><strong>Released Time</strong></td>
        <td><strong>Download</strong></td>
    </tr>
    <tr>
	    <td>1.0</td>
    	<td>Manage physical reader and real-time check experimental results.</td>
        <td>2016/6/1</td>
        <td><a href="">TagSee-1.0.zip</a></td>
    </tr>
</table>


## <strong>Features</strong>

TagSee wraps the simple ImpinJ-extended APIs and offers a nice dashboard for quickly startup on collecting RFID readings. Basic useful feature list:

 * Manage your physical reader.
 * View experimental results in real-time.
 * Download experimental results.
 * Filter unexpected tags.

## <strong>Supported Platforms</strong>

* Windows/Mac/Linux
* ImpinJ R420 Reader

## <strong>Usage</strong>

1.Donwload tagsee-xxx.zip and extract it to local disk

2.Run the 'startup.sh' or 'startup.bat' in 'terminal' (Mac) or 'cmd' (Windows)
```bash
bash startup.sh
```
3.The system will automatically jump to dashboard page, or you can accesss the following address: <a href="http://localhost:9092">http://localhost:9092</a>

## <strong>Notice</strong>

* Dashboard uses IndexDB, supported by browsers, to store the readings received from tagsee. The database size is limited over browsers. Please ensure you download the experimental results to your local disk in time. In the future, I will upload the readigns to server side.

* The maximum reading number is set to 50,000 (about last 1-hour reading). Older readings will be discarded when new reading incomes if the number exceeds the maximum.

* Only latested 1,000 readings will be displayed in the charts to keep the rendering more smooth.

* The reader and ro specification are respectively read from <code>config/reader__config.default.xml</code> and <code>config/rospec.defualt.xml</code>. If you want to change the configuration, please copy these two files and modify their names to <code>config/reader__config.xml</code> and <code>config/rospec.xml</code> (remove the 'default' word). TagSee will preferentially read configuration files from the none-default version. The change immediately works in the next experiment without need to restart TagSee.

## <strong>APIs</strong>

Besides controllable dashborad, TagSee also offers a set of wrapped APIs for upper applications.

### 1. Discover agents

```javascript

Path: /service/discover
Action: GET
Parameters: none
Returns:
	- errorCode: 0
	- agents[]: a list of agent stored in server.

```

### 2. Create agent
```javascript

Path: /service/agent/create
Action: POST
Paramters:
	- ip: reader's ip, which should be
	- name: name of the reader.
	- remark: description of this reader.
Return:
	- errorCode: 0
```

### 3. Update agent
```javascript

Path: /service/agent/:ip/update
Action: POST
Parameters:
	- ip: reader's ip.
	- name: the reader's name.
	- remark: description of this reader.
Return:
	- errorCode: 0
```

### 4. Remove agent
```javascript

Path: /service/agent/:ip/remove 
Action: POST
Parameters:
	- ip: reader's ip.
Return:
    - errorCode: 0
```

### 5. Start reading
```javascript

Path: /service/agent/:ip/start
Action: GET
Parameter: None
Return:
	- errorCode: 0
```

### 6. Stop reading
```javascript

Path: /service/agent/:ip/stop
Action: GET
Parameter: Nnone
Return:
	- errorCode: 0
```

### 7. Websocket messages

TagSee uses websocket to push heartbeat and readings.

```javascript

Message: Heartbeat
Structure:
	- errorCode: 0
	- type: heartbeat

Message: Readings
Structure:
	- errorCode: 0
	- type: reading
	- tags[{
		epc: tag epc,
        phase: pahse value,
        rssi: rss value,
        doppler: doppler value,
        channel: channel index,
        antenna: antenna idnex
        peekRssi: peek rssi (Impinj extened feild),
        firstSeenTime: the timestamp attached by the reader,
        lastSeenTime: the timestamp attached by the reader,
        timestap: the timestamp attached by the tagsee
    }]

```






