import { Component, createResource, Show } from "solid-js";
import "./App.css";

import "@picocss/pico";

import "./accel";
import { requestPermission } from "./accel";
import { HourGlass } from "./HourGlass";

const App: Component = () => {
  const [accelPermission, { refetch }] = createResource(async () => {
    const result = await requestPermission();
    console.log("Accelerometer Permission", result);
    return result;
  });

  return (
    <>
      <Show when={!accelPermission()}>
        <div class="overlay">
          To start the Hourglass, you need to grant permission to access the
          accelerometer
          <br />
          <button onClick={refetch}>Request Permission</button>
        </div>
      </Show>
      <div class="cont" style={{ "background-color": "black" }}>
        <HourGlass
          n={40}
          backgroundColor="black"
          onColor="red"
          offColor="gray"
        />
      </div>
    </>
  );
};

export default App;
