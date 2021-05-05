"use strict";
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

const ping = require("ping");
const os = require("os");

const min = 0;
let _activeIP = null;
let _aliveIPList = [];
let hostNetworkList = [];

const getHostIP = () => {
  const nets = os.networkInterfaces();
  const ipList = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        ipList.push(net.address);
      }
    }
  }
  return ipList;
};

const processHostIP = (cb) => {
  const hostIpArr = getHostIP();

  if (hostIpArr.length < 1) {
    //logError(true, "#GIPS 05: Host IP unknown.");
    return false;
  }

  // Select 1st Index of IP list
  _activeIP = hostIpArr[0];
  //
  const exludeLastOctet = _activeIP.split(".").slice(0, -1).join(".");

  // Create a Array of 255 Elements
  hostNetworkList = [];
  for (let i = 0; i < 255; i++) {
    hostNetworkList[i] = `${exludeLastOctet}.${i + 1}`;
  }

  cb();
};

const generatePrimes = (start, range) => {
  processHostIP(() => {
    let end = start + range;

    let ip_batch = hostNetworkList.slice(start, end);
    console.log(ip_batch.join(" "));
    ip_batch.forEach(function (host) {
      ping.promise
        .probe(host, {
          timeout: 1,
        })
        .then((res) => {
          if (res.alive) {
            console.log(res.host);
            _aliveIPList.push(res.host);
            parentPort.postMessage([res.host]);
          }
        });
    });
  });
};

if (isMainThread) {
  const max = 255;
  const threadCount = 51;
  const threads = new Set();
  console.log(`Running with ${threadCount} threads...`);
  const range = Math.ceil((max - min) / threadCount);
  let start = min;

  for (let i = 0; i < threadCount - 1; i++) {
    const myStart = start;
    threads.add(
      new Worker(__filename, { workerData: { start: myStart, range } })
    );
    start += range;
  }
  threads.add(
    new Worker(__filename, {
      workerData: { start, range: range + ((max - min + 1) % threadCount) },
    })
  );
  for (let worker of threads) {
    worker.on("error", (err) => {
      throw err;
    });
    worker.on("exit", () => {
      threads.delete(worker);
      console.log(`Thread exiting, ${threads.size} running...`);
      if (threads.size === 0) {
        console.log(_aliveIPList.join("\n"));
      }
    });
    worker.on("message", (msg) => {
      //console.log(msg);
      _aliveIPList = _aliveIPList.concat(msg);
    });
  }
} else {
  generatePrimes(workerData.start, workerData.range);
}

if (isMainThread) {
}
