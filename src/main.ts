import "./style.css";
import { load } from "./load";

async function main() {
    const game = await load();

    game.run();
}

main();
