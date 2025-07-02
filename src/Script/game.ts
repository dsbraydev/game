import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "babylonjs-materials";
import type { Engine, Scene, Mesh } from "babylonjs";

let engine: Engine;
let scene: Scene;
let trophyMesh: Mesh | null = null;
let bombMesh: Mesh | null = null;
let camera: BABYLON.ArcRotateCamera;

const winSound = new Audio("/Audio/SFX/Click-96-k.aac");
const correctSound = new Audio("/Audio/SFX/correct.mp3");
const failSound = new Audio("/Audio/SFX/fail.mp3");

// Top of your file
const streakTrophies: BABYLON.Mesh[] = [];
const trophyStartPosition = new BABYLON.Vector3(0, -2, 0);
const trophySmallScale = new BABYLON.Vector3(0.12, 0.12, 0.12);
const trophyBigScale = new BABYLON.Vector3(0.5, 0.5, 0.5);
const trophyStreakBasePos = new BABYLON.Vector3(-7, -3.5, 0);
const trophySpacing = 1.5;

function animateTrophyToStreak(index: number): Promise<void> {
  return new Promise((resolve) => {
    if (!trophyMesh) {
      resolve();
      return;
    }

    const targetPos = trophyStreakBasePos.add(
      new BABYLON.Vector3(trophySpacing * index, 0, 0)
    );

    // ⏱ Delay start by 500ms
    setTimeout(() => {
      // Animate position
      BABYLON.Animation.CreateAndStartAnimation(
        "moveTrophy",
        trophyMesh,
        "position",
        30,
        30, // or whatever speed you want
        trophyMesh.position.clone(),
        targetPos,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Animate scale
      BABYLON.Animation.CreateAndStartAnimation(
        "scaleTrophy",
        trophyMesh,
        "scaling",
        30,
        30,
        trophyBigScale.clone(),
        trophySmallScale.clone(),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        undefined,
        () => {
          // After animation completes
          const newTrophy = trophyMesh.clone("streakTrophy_" + index);
          if (newTrophy) {
            newTrophy.position = targetPos.clone();
            newTrophy.scaling = trophySmallScale.clone();
            newTrophy.setEnabled(true);
            streakTrophies.push(newTrophy);
          }

          trophyMesh.setEnabled(false);
          trophyMesh.position = trophyStartPosition.clone();
          trophyMesh.scaling = trophyBigScale.clone();

          resolve();
        }
      );
    }, 500); // ← delay in milliseconds
  });
}

function clearStreakTrophies() {
  streakTrophies.forEach((t) => t.dispose());
  streakTrophies.length = 0;
}

function createScene(): Scene {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);
  scene.onBeforeRenderObservable.add(() => {
    if (trophyMesh?.isEnabled()) {
      trophyMesh.rotation.y += 0.01;
    }
  });

  const glowLayer = new BABYLON.GlowLayer("glow", scene);
  glowLayer.intensity = 0.7;
  scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
    "https://playground.babylonjs.com/textures/environment.dds",
    scene
  );

  const skybox = scene.createDefaultSkybox(
    scene.environmentTexture,
    true,
    1000
  );
  skybox.isVisible = false;

  camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    1,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);

  new BABYLON.SpotLight(
    "spotLight",
    new BABYLON.Vector3(0, 5, -5),
    new BABYLON.Vector3(0, 1, 1),
    Math.PI / 3,
    10,
    scene
  ).intensity = 0.8;
  new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  ).intensity = 2.0;
  new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-1, -2, -1),
    scene
  ).position = new BABYLON.Vector3(20, 40, 20);

  BABYLON.SceneLoader.ImportMesh(
    "",
    "Models/",
    "Trophy.glb",
    scene,
    (meshes) => {
      trophyMesh = meshes[0] as Mesh;
      trophyMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
      trophyMesh.setEnabled(false);
      trophyMesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
      trophyMesh.position = new BABYLON.Vector3(0, -2, 0);
      camera.radius = 8;

      const goldMaterial = new BABYLON.PBRMaterial("goldMat", scene);

      const trophyTexture = new BABYLON.Texture(
        "/Textures/Trophy.webp",
        scene,
        false,
        false
      );

      goldMaterial.albedoTexture = trophyTexture;
      goldMaterial.albedoColor = new BABYLON.Color3(1.0, 0.85, 0.5);
      goldMaterial.metallic = 0.9;
      goldMaterial.roughness = 0.3;
      goldMaterial.environmentIntensity = 1.0;

      meshes.forEach((mesh) => {
        mesh.material = goldMaterial;
      });
    }
  );

  BABYLON.SceneLoader.ImportMesh("", "Models/", "bomb.glb", scene, (meshes) => {
    bombMesh = meshes[0] as Mesh;
    bombMesh.setEnabled(false);
    bombMesh.scaling = new BABYLON.Vector3(0.005, 0.005, 0.005); // ← 10x smaller
    bombMesh.position = new BABYLON.Vector3(0, -2, 0);
    bombMesh.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
  });

  engine.runRenderLoop(() => scene.render());
  return scene;
}

window.addEventListener("DOMContentLoaded", () => {
  createScene();
});

let correctIndex: number;
let streak = 0;

document.getElementById("startButton")?.addEventListener("click", () => {
  document.getElementById("intro")!.style.display = "none";
  document.getElementById("gameplay")!.style.display = "block";
  resetGame();
});

function resetGame() {
  correctIndex = Math.floor(Math.random() * 2);
  document.getElementById("resultText")!.textContent = "";
  bombMesh?.setEnabled(false);
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("flipped");
    const frontImg = card.querySelector(".card-front img") as HTMLImageElement;
    const backImg = card.querySelector(".card-back img") as HTMLImageElement;
    frontImg.src = "./Textures/Card/backCard.webp";
    backImg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    (card as HTMLElement).style.pointerEvents = "auto";
  });
}

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => {
    const index = parseInt((card as HTMLElement).dataset.index!);
    document
      .querySelectorAll(".card")
      .forEach((c) => ((c as HTMLElement).style.pointerEvents = "none"));

    const isCorrect = index === correctIndex;
    winSound.currentTime = 0;
    winSound.play();
    (isCorrect ? correctSound : failSound).play();

    const cardBackImg = card.querySelector(
      ".card-back img"
    ) as HTMLImageElement;
    cardBackImg.src = isCorrect
      ? "./Textures/Card/treasureCard.webp"
      : "./Textures/Card/bombCard.webp";
    card.classList.add("flipped");
    const streakCountEl = document.getElementById("streakCount")!;
    streakCountEl.textContent = streak.toString();

    streakCountEl.classList.remove("streak-animate");
    void streakCountEl.offsetWidth;
    streakCountEl.classList.add("streak-animate");

    setTimeout(() => {
      const resultText = document.getElementById("resultText")!;
      if (isCorrect) {
        resultText.textContent = "🎉 You found the treasure!";
        bombMesh?.setEnabled(false);

        streak++; // increment once only

        if (trophyMesh) {
          trophyMesh.setEnabled(true);
          trophyMesh.position = trophyStartPosition.clone();
          trophyMesh.scaling = trophyBigScale.clone();

          // Animate big trophy to streak position and clone small trophy there
          animateTrophyToStreak(streak - 1);
        }
      } else {
        resultText.textContent = "💥 BOOM!!!";
        streak = 0;

        // Hide big trophy and bombMesh appropriately
        trophyMesh?.setEnabled(false);

        // Clear all small trophies
        clearStreakTrophies();

        if (bombMesh) {
          bombMesh.setEnabled(true);
          bombMesh.position = new BABYLON.Vector3(0, -1, 0);
          bombMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
          bombMesh.rotation = new BABYLON.Vector3(0, Math.PI / 12, 0);

          BABYLON.Animation.CreateAndStartAnimation(
            "bombScale",
            bombMesh,
            "scaling",
            30,
            15,
            new BABYLON.Vector3(0.01, 0.01, 0.01),
            new BABYLON.Vector3(0.01, 0.01, 0.01),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );
        }
      }

      document.getElementById("streakCount")!.textContent = streak.toString();
      setTimeout(() => resetGame(), 2000);
    }, 600);
  });
});

export { createScene, trophyMesh };
