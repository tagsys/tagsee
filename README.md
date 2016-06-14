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
	    <td>1.1</td>
    	<td>Fixed bugs about download</td>
        <td>2016/6/1</td>
        <td><a href="https://www.dropbox.com/s/ge5zwqxbnotwdy9/tagsee-1.1.zip?dl=0" target="_blank">tagsee-1.1.zip</a></td>
    </tr>
    <tr>
	    <td>1.0</td>
    	<td>Manage physical reader and real-time check experimental results.</td>
        <td>2016/6/1</td>
        <td><a href="https://www.dropbox.com/s/qpln5o29rlaqpfo/tagsee-1.0.zip?dl=0" target="_blank">tagsee-1.0.zip</a></td>
    </tr>
</table>


## <strong>Features</strong>

TagSee wraps the ImpinJ-extended APIs and offers a nice dashboard for quickly startup on collecting RFID readings. Basic useful feature list:

 * Manage your physical reader.
 * View experimental results in real-time.
 * Download experimental results.
 * Filter unexpected tags.

## <strong>Supported Platforms</strong>

* Windows/Mac/Linux + Java 8
* ImpinJ R420 Reader

## <strong>Usage</strong>

Follow the simple three steps:

1. Donwload tagsee-xxx.zip and extract it to local disk

2. Run the 'startup.sh' or 'startup.bat' in 'terminal' (Mac) or 'cmd' (Windows)
```bash
bash startup.sh
```
3. The system will automatically jump to dashboard page, or you can accesss the following address: <a href="http://localhost:9092">http://localhost:9092</a>

## <strong>Compiling</strong>

If you would like to compile the source code, then you could do it as follows:

<strong>Prerequisite</strong> 

1. Install Apache Maven. (refer to <a href="https://maven.apache.org/install.html" target="_blank">Maven</a> client)

2. Install Bower. (refer to <a href="http://bower.io/" target="_blank">Twitter Bower</a> client).

3. Install Git. (refer to <a href="https://git-scm.com/downloads" target="_blank">Git</a> client.)

<strong>Steps</strong>

1.Checkout the source code.
```
git clone https://github.com/tagsys/tagsee.git
```
2.Run the complie.sh inside `dashboard'. It is going to downlaod the neccessary js files with bower tool.
```
bash comiple.sh
```
3.Run Apache Maven commands as follows. 
```
mvb clean package
```
4.Find the compiled results in the directory named 'target'.

## <strong>Notice</strong>

* Dashboard uses IndexDB, supported by browsers, to store the readings received from tagsee. The database size is limited over browsers. Please ensure you download the experimental results to your local disk in time. In the future, I will upload the readigns to server side.

* Only latested 1,000 readings will be displayed in the charts to keep the rendering more smooth.

* The Reader and RO specification are respectively read from the files of  <code>config/reader__config.default.xml</code> and <code>config/rospec.defualt.xml</code>. If you want to change the configuration, please copy these two files and modify their names to <code>config/reader__config.xml</code> and <code>config/rospec.xml</code> (remove the 'default' word and keep the default files for safty). TagSee will preferentially read configuration files from the none-default version. The change immediately works in the next experiment without need to restart TagSee.

## <strong>API</strong>

Besides the controllable dashborad, TagSee also offers a set of wrapped APIs for upper applications. These APIs are useful if you want to develop your own applications. TagSee provides a set of RESTful style APIs and Websocket-based reading reports. You could use any language or platform to develop your applications.

I also give many examples over different programming languages in the examples directory to show how to start, stop and read tags using TagSee. Currently, these exampels are writtern using Java.

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
	- ip: reader ip, which should be
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
	- ip: reader ip.
	- name: the reader name.
	- remark: description of this reader.
Return:
	- errorCode: 0
```

### 4. Remove agent
```javascript

Path: /service/agent/:ip/remove 
Action: POST
Parameters:
	- ip: reader ip.
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

## Reference

If this project helps you, please help cite the following paper. Thanks very much.

```latex
@inproceedings{yang2014tagoram,
  title={Tagoram: Real-time tracking of mobile RFID tags to high precision using COTS devices},
  author={Yang, Lei and Chen, Yekui and Li, Xiang-Yang and Xiao, Chaowei and Li, Mo and Liu, Yunhao},
  booktitle={Proceedings of ACM MobiCom},
  pages={237--248},
  year={2014}
}

```

## Changelog

* 2016/6/1 - release the TagSee v1.
* 2016/6/8 - add Java example.

## Acknowledgement

This project acknowledges significant help, feedback, suggestions and guidance from following people.

- Tianci Liu. This guy developed a primary and offline RFID reading tool for our group. It inpsired me to develop TagSee.
