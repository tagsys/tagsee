package org.tagsys.tagsee;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.concurrent.TimeoutException;
import java.util.List;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom.JDOMException;

import org.llrp.ltk.generated.enumerations.*;
import org.llrp.ltk.generated.interfaces.*;
import org.llrp.ltk.generated.messages.*;
import org.llrp.ltk.generated.parameters.*;
import org.llrp.ltk.types.*;
import org.llrp.ltk.net.LLRPConnection;
import org.llrp.ltk.net.LLRPConnectionAttemptFailedException;
import org.llrp.ltk.net.LLRPConnector;
import org.llrp.ltk.net.LLRPEndpoint;
import org.llrp.ltk.util.Util;

import com.google.gson.Gson;
import com.google.gson.annotations.Expose;

import org.llrp.ltk.exceptions.InvalidLLRPMessageException;
import org.llrp.ltk.generated.custom.messages.*;
import org.llrp.ltk.generated.custom.parameters.*;

public class Agent{

	private transient LLRPConnection connection;

	private String ip;
	
	private int status; // 0 - disconnected, 1 - connected, 2 - reading.
	
	private String name;
	
	private String remark;
	
	private long createdTime;
	
	private long lastUpdatedTime;

	private static Logger logger = Logger.getLogger(Agent.class);

	private transient ROSpec rospec;
	
	private transient int MessageID = (int)Math.floor(Math.random()*50); // a random starting point
	
	@Expose(serialize=false)
	private UnsignedInteger modelName;
	
	@Expose(serialize=false)
	UnsignedShort maxPowerIndex;
	
	@Expose(serialize=false)
	SignedShort maxPower;
	
	@Expose(serialize=false)
	UnsignedShort channelIndex;
	
	@Expose(serialize=false)
	UnsignedShort hopTableID;

	private UnsignedInteger getUniqueMessageID() {
		return new UnsignedInteger(MessageID);
	}

	public Agent(String ip) {
		this.ip = ip;

	}
	
	public int getStatus(){
		return this.status;
	}
	
	public String getIP(){
		return this.ip;
	}
	
	public void setName(String name){
		this.name = name;
	}
	
	public String getName(){
		return this.name;
	}
	
	public void setRemark(String remark){
		this.remark = remark;
	}
	
	public String getRemark(){
		return this.remark;
	}
	
	public long getCreatedTime(){
		return this.createdTime;
	}
	
	public void setCreatedTime(long time){
		this.createdTime = time;
	}
	
	public long getLastUpdatedTime(){
		return this.lastUpdatedTime;
	}
	
	public void setLastUpdatedTime(long time){
		this.lastUpdatedTime = time;
	}

	public boolean connect(LLRPEndpoint endpoint) throws LLRPConnectionAttemptFailedException {
		// create client-initiated LLRP connection

		connection = new LLRPConnector(endpoint, this.ip);

		// connect to reader
		// LLRPConnector.connect waits for successful
		// READER_EVENT_NOTIFICATION from reader
		try {
			logger.info("Initiate LLRP connection to reader");
			((LLRPConnector) connection).connect();
			this.status = 1;
			return true;
		} catch (LLRPConnectionAttemptFailedException e1) {
			e1.printStackTrace();
			throw e1;
		}
	}

	public boolean disconnect() throws InvalidLLRPMessageException, TimeoutException {
		LLRPMessage response;
		CLOSE_CONNECTION close = new CLOSE_CONNECTION();
		close.setMessageID(getUniqueMessageID());
		try {
			// don't wait around too long for close
			response = connection.transact(close, 4000);

			// check whether ROSpec addition was successful
			StatusCode status = ((CLOSE_CONNECTION_RESPONSE) response).getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("CLOSE_CONNECTION was successful");
				this.status = 0;
				return true;
			} else {
				logger.info(response.toXMLString());
				logger.info("CLOSE_CONNECTION Failed ... continuing anyway");
				return false;
			}

		} catch (InvalidLLRPMessageException ex) {
			logger.error("CLOSE_CONNECTION: Received invalid response message");
			return false;
		} catch (TimeoutException ex) {
			logger.info("CLOSE_CONNECTION Timeouts ... continuing anyway");
			return false;
		}
	}

	public boolean enableImpinjExtensions() {
		LLRPMessage response;

		try {
			logger.info("IMPINJ_ENABLE_EXTENSIONS ...");
			IMPINJ_ENABLE_EXTENSIONS ena = new IMPINJ_ENABLE_EXTENSIONS();
			ena.setMessageID(getUniqueMessageID());

			response = connection.transact(ena, 10000);

			StatusCode status = ((IMPINJ_ENABLE_EXTENSIONS_RESPONSE) response).getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("IMPINJ_ENABLE_EXTENSIONS was successful");
			} else {
				logger.info(response.toXMLString());
				logger.info("IMPINJ_ENABLE_EXTENSIONS Failure");
				return false;
			}
			return true;
		} catch (InvalidLLRPMessageException ex) {
			logger.error("Could not process IMPINJ_ENABLE_EXTENSIONS response");
			return false;
		} catch (TimeoutException ex) {
			logger.error("Timeout Waiting for IMPINJ_ENABLE_EXTENSIONS response");
			return false;
		}
	}

	public boolean factoryDefault() {
		LLRPMessage response;

		try {
			// factory default the reader
			logger.info("SET_READER_CONFIG with factory default ...");
			SET_READER_CONFIG set = new SET_READER_CONFIG();
			set.setMessageID(getUniqueMessageID());
			set.setResetToFactoryDefault(new Bit(true));
			response = connection.transact(set, 10000);

			// check whether ROSpec addition was successful
			StatusCode status = ((SET_READER_CONFIG_RESPONSE) response).getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("SET_READER_CONFIG Factory Default was successful");
			} else {
				logger.info(response.toXMLString());
				logger.info("SET_READER_CONFIG Factory Default Failure");
				return false;
			}

			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	public void getReaderCapabilities() {
		LLRPMessage response;
		GET_READER_CAPABILITIES_RESPONSE gresp;

		GET_READER_CAPABILITIES get = new GET_READER_CAPABILITIES();
		GetReaderCapabilitiesRequestedData data = new GetReaderCapabilitiesRequestedData(
				GetReaderCapabilitiesRequestedData.All);
		get.setRequestedData(data);
		get.setMessageID(getUniqueMessageID());
		logger.info("Sending GET_READER_CAPABILITIES message  ...");
		try {
			response = connection.transact(get, 10000);

			// check whether GET_CAPABILITIES addition was successful
			gresp = (GET_READER_CAPABILITIES_RESPONSE) response;
			StatusCode status = gresp.getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("GET_READER_CAPABILITIES was successful");

				// get the info we need
				GeneralDeviceCapabilities dev_cap = gresp.getGeneralDeviceCapabilities();
				if ((dev_cap == null) || (!dev_cap.getDeviceManufacturerName().equals(new UnsignedInteger(25882)))) {
					logger.error("DocSample4 must use Impinj model Reader, not "
							+ dev_cap.getDeviceManufacturerName().toString());
					System.exit(1);
				}

				modelName = dev_cap.getModelName();
				logger.info("Found Impinj reader model " + modelName.toString());

				// get the max power level
				if (gresp.getRegulatoryCapabilities() != null) {
					UHFBandCapabilities band_cap = gresp.getRegulatoryCapabilities().getUHFBandCapabilities();

					List<TransmitPowerLevelTableEntry> pwr_list = band_cap.getTransmitPowerLevelTableEntryList();

					TransmitPowerLevelTableEntry entry = pwr_list.get(pwr_list.size() - 1);

					maxPowerIndex = entry.getIndex();
					maxPower = entry.getTransmitPowerValue();
					// LLRP sends power in dBm * 100
					double d = ((double) maxPower.intValue()) / 100;

					logger.info("Max power " + d + " dBm at index " + maxPowerIndex.toString());
				}
			} else {
				logger.info(response.toXMLString());
				logger.info("GET_READER_CAPABILITIES failures");
				System.exit(1);
			}
		} catch (InvalidLLRPMessageException ex) {
			logger.error("Could not display response string");
		} catch (TimeoutException ex) {
			logger.error("Timeout waiting for GET_READER_CAPABILITIES response");
			System.exit(1);
		}
	}

	public void getReaderConfiguration() {
		LLRPMessage response;
		GET_READER_CONFIG_RESPONSE gresp;

		GET_READER_CONFIG get = new GET_READER_CONFIG();
		GetReaderConfigRequestedData data = new GetReaderConfigRequestedData(GetReaderConfigRequestedData.All);
		get.setRequestedData(data);
		get.setMessageID(getUniqueMessageID());
		get.setAntennaID(new UnsignedShort(0));
		get.setGPIPortNum(new UnsignedShort(0));
		get.setGPOPortNum(new UnsignedShort(0));

		logger.info("Sending GET_READER_CONFIG message  ...");
		try {
			response = connection.transact(get, 10000);

			// check whether GET_CAPABILITIES addition was successful
			gresp = (GET_READER_CONFIG_RESPONSE) response;
			StatusCode status = gresp.getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("GET_READER_CONFIG was successful");

				List<AntennaConfiguration> alist = gresp.getAntennaConfigurationList();

				if (!alist.isEmpty()) {
					AntennaConfiguration a_cfg = alist.get(0);
					channelIndex = a_cfg.getRFTransmitter().getChannelIndex();
					hopTableID = a_cfg.getRFTransmitter().getHopTableID();
					logger.info("ChannelIndex " + channelIndex.toString() + " hopTableID " + hopTableID.toString());
				} else {
					logger.error("Could not find antenna configuration");
					System.exit(1);
				}
			} else {
				logger.info(response.toXMLString());
				logger.info("GET_READER_CONFIG failures");
				System.exit(1);
			}
		} catch (InvalidLLRPMessageException ex) {
			logger.error("Could not display response string");
		} catch (TimeoutException ex) {
			logger.error("Timeout waiting for GET_READER_CONFIG response");
			System.exit(1);
		}
	}

	public ADD_ROSPEC buildROSpecFromObjects() {
		logger.info("Building ADD_ROSPEC message from scratch ...");
		ADD_ROSPEC addRoSpec = new ADD_ROSPEC();
		addRoSpec.setMessageID(getUniqueMessageID());

		rospec = new ROSpec();

		// set up the basic info for the RO Spec.
		rospec.setCurrentState(new ROSpecState(ROSpecState.Disabled));
		rospec.setPriority(new UnsignedByte(0));
		rospec.setROSpecID(new UnsignedInteger(12345));

		// set the start and stop conditions for the ROSpec.
		// For now, we will start and stop manually
		ROBoundarySpec boundary = new ROBoundarySpec();
		ROSpecStartTrigger start = new ROSpecStartTrigger();
		ROSpecStopTrigger stop = new ROSpecStopTrigger();
		start.setROSpecStartTriggerType(new ROSpecStartTriggerType(ROSpecStartTriggerType.Null));
		stop.setROSpecStopTriggerType(new ROSpecStopTriggerType(ROSpecStopTriggerType.Null));
		stop.setDurationTriggerValue(new UnsignedInteger(0));
		boundary.setROSpecStartTrigger(start);
		boundary.setROSpecStopTrigger(stop);
		rospec.setROBoundarySpec(boundary);

		// set up what we want to do in the ROSpec. In this case
		// build the simples inventory on all channels using defaults
		AISpec aispec = new AISpec();

		// what antennas to use.
		UnsignedShortArray ants = new UnsignedShortArray();
		ants.add(new UnsignedShort(0)); // 0 means all antennas
		aispec.setAntennaIDs(ants);

		// set up the AISpec stop condition and options for inventory
		AISpecStopTrigger aistop = new AISpecStopTrigger();
		aistop.setAISpecStopTriggerType(new AISpecStopTriggerType(AISpecStopTriggerType.Null));
		aistop.setDurationTrigger(new UnsignedInteger(0));
		aispec.setAISpecStopTrigger(aistop);

		// set up any override configuration. none in this case
		InventoryParameterSpec ispec = new InventoryParameterSpec();
		ispec.setAntennaConfigurationList(null);
		ispec.setInventoryParameterSpecID(new UnsignedShort(23));
		ispec.setProtocolID(new AirProtocols(AirProtocols.EPCGlobalClass1Gen2));
		List<InventoryParameterSpec> ilist = new ArrayList<InventoryParameterSpec>();
		ilist.add(ispec);

		aispec.setInventoryParameterSpecList(ilist);
		List<SpecParameter> slist = new ArrayList<SpecParameter>();
		slist.add(aispec);
		rospec.setSpecParameterList(slist);

		addRoSpec.setROSpec(rospec);

		return addRoSpec;
	}

	public ADD_ROSPEC buildROSpecFromFile() {
		logger.info("Loading ADD_ROSPEC message from file ADD_ROSPEC.xml ...");
		try {
			LLRPMessage addRospec = Util.loadXMLLLRPMessage(new File("./src/main/resources/ADD_ROSPEC.xml"));
			// TODO make sure this is an ADD_ROSPEC message
			return (ADD_ROSPEC) addRospec;
		} catch (FileNotFoundException ex) {
			logger.error("Could not find file");
		} catch (IOException ex) {
			logger.error("IO Exception on file");
		} catch (JDOMException ex) {
			logger.error("Unable to convert LTK-XML to DOM");
		} catch (InvalidLLRPMessageException ex) {
			logger.error("Unable to convert LTK-XML to Internal Object");
		}
		return null;
	}

	public boolean setReaderConfiguration() throws TimeoutException {
		LLRPMessage response;

		logger.info("Loading SET_READER_CONFIG message from file SET_READER_CONFIG.xml ...");

		LLRPMessage setConfigMsg;
		try {
			setConfigMsg = Util.loadXMLLLRPMessage(new File("./src/main/resources/SET_READER_CONFIG.xml"));

			response = connection.transact(setConfigMsg, 10000);

			// check whetherSET_READER_CONFIG addition was successful
			StatusCode status = ((SET_READER_CONFIG_RESPONSE) response).getLLRPStatus().getStatusCode();
			if (status.equals(new StatusCode("M_Success"))) {
				logger.info("SET_READER_CONFIG was successful");
				return true;
			} else {
				logger.info(response.toXMLString());
				logger.info("SET_READER_CONFIG failures");
				return false;
			}
		} catch (IOException | JDOMException | InvalidLLRPMessageException e) {
	
			e.printStackTrace();
			return false;
		}

	}

	public boolean addRoSpec(boolean xml) throws TimeoutException, InvalidLLRPMessageException {
		LLRPMessage response;

		ADD_ROSPEC addRospec = null;

		if (xml) {
			addRospec = buildROSpecFromFile();
		} else {
			addRospec = buildROSpecFromObjects();
		}


		addRospec.setMessageID(getUniqueMessageID());
		rospec = addRospec.getROSpec();

		logger.info("Sending ADD_ROSPEC message  ...");

		response = connection.transact(addRospec, 10000);

		// check whether ROSpec addition was successful
		StatusCode status = ((ADD_ROSPEC_RESPONSE) response).getLLRPStatus().getStatusCode();
		if (status.equals(new StatusCode("M_Success"))) {
			logger.info("ADD_ROSPEC was successful");
			return true;
		} else {
			logger.info(response.toXMLString());
			logger.info("ADD_ROSPEC failures");
			return false;
		}

	}
	
	// Delete all ROSpecs from the reader.
    public boolean deleteROSpecs()
    {
        DELETE_ROSPEC_RESPONSE response;
         
        logger.info("Deleting all ROSpecs.");
        DELETE_ROSPEC del = new DELETE_ROSPEC();
        // Use zero as the ROSpec ID. 
        // This means delete all ROSpecs.
        del.setROSpecID(new UnsignedInteger(0));
        try{
            response = (DELETE_ROSPEC_RESPONSE) connection.transact(del, 10000);
            logger.info(response.toXMLString());
            return true;
        } 
        catch (Exception e) 
        {
            logger.info("Error deleting ROSpec.");
            e.printStackTrace();
            return false;
        }
    }

	public boolean enable() throws TimeoutException, InvalidLLRPMessageException {
		LLRPMessage response;

		// factory default the reader
		logger.info("ENABLE_ROSPEC ...");
		ENABLE_ROSPEC ena = new ENABLE_ROSPEC();
		ena.setMessageID(getUniqueMessageID());
		ena.setROSpecID(rospec.getROSpecID());

		response = connection.transact(ena, 10000);

		// check whether ROSpec addition was successful
		StatusCode status = ((ENABLE_ROSPEC_RESPONSE) response).getLLRPStatus().getStatusCode();
		if (status.equals(new StatusCode("M_Success"))) {
			logger.info("ENABLE_ROSPEC was successful");
			return true;
		} else {
			logger.error(response.toXMLString());
			logger.info("ENABLE_ROSPEC_RESPONSE failed ");
			return false;
		}

	}

	public boolean start() throws TimeoutException, InvalidLLRPMessageException {
		
		LLRPMessage response;

		this.status = 2;

		logger.info("START_ROSPEC ...");
		START_ROSPEC start = new START_ROSPEC();
		start.setMessageID(getUniqueMessageID());
		start.setROSpecID(rospec.getROSpecID());

		response = connection.transact(start, 10000);

		// check whether ROSpec addition was successful
		StatusCode status = ((START_ROSPEC_RESPONSE) response).getLLRPStatus().getStatusCode();
		if (status.equals(new StatusCode("M_Success"))) {
			logger.info("START_ROSPEC was successful");
			return true;
		} else {
			logger.error(response.toXMLString());
			logger.info("START_ROSPEC_RESPONSE failed ");
			return false;
		}

	}

	public boolean stop() throws TimeoutException, InvalidLLRPMessageException {
		LLRPMessage response;

		this.status = 1;
		logger.info("STOP_ROSPEC ...");
		STOP_ROSPEC stop = new STOP_ROSPEC();
		
		if(rospec==null){
			return false;
		}
		
		stop.setMessageID(getUniqueMessageID());
		stop.setROSpecID(rospec.getROSpecID());

		response = connection.transact(stop, 10000);

		// check whether ROSpec addition was successful
		StatusCode status = ((STOP_ROSPEC_RESPONSE) response).getLLRPStatus().getStatusCode();
		if (status.equals(new StatusCode("M_Success"))) {
			logger.info("STOP_ROSPEC was successful");
			return true;
		} else {
			logger.error(response.toXMLString());
			logger.info("STOP_ROSPEC_RESPONSE failed ");
			return false;
		}

	}


}
