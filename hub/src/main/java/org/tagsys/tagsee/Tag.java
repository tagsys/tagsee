package org.tagsys.tagsee;

public class Tag {
	
	private String epc;
	private String data;
	private int antenna;
	private int channel;
	private long firstSeenTime;
	private long lastSeenTime;
	private int rssi;
	private int seenCount;
	private int phase;
	private int peekRssi;
	private long timestamp;
	private int doppler;
	
	public String getEpc() {
		return epc;
	}
	public void setEpc(String epc) {
		this.epc = epc;
	}
	public String getData(){
		return this.data;
	}
	
	public void setData(String data){
		this.data = data;
	}
	
	public int getAntenna() {
		return antenna;
	}
	public void setAntenna(int antenna) {
		this.antenna = antenna;
	}
	public int getChannel() {
		return channel;
	}
	public void setChannel(int channel) {
		this.channel = channel;
	}
	public long getFirstSeenTime() {
		return firstSeenTime;
	}
	public void setFirstSeenTime(long firstSeenTime) {
		this.firstSeenTime = firstSeenTime;
	}
	public long getLastSeenTime() {
		return lastSeenTime;
	}
	public void setLastSeenTime(long lastSeenTime) {
		this.lastSeenTime = lastSeenTime;
	}
	public int getRssi() {
		return rssi;
	}
	public void setRssi(int rssi) {
		this.rssi = rssi;
	}
	public int getSeenCount() {
		return seenCount;
	}
	public void setSeenCount(int seenCount) {
		this.seenCount = seenCount;
	}
	public int getPhase() {
		return phase;
	}
	public void setPhase(int phase) {
		this.phase = phase;
	}
	public int getPeekRssi() {
		return peekRssi;
	}
	public void setPeekRssi(int peekRssi) {
		this.peekRssi = peekRssi;
	}
	
	public int getDoppler(){
		return doppler;
	}
	
	public void setDoppler(int doppler){
		this.doppler = doppler;
	}
	
	public long getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
	}
	

}
