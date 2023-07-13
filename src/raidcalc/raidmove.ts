import { State } from "../calc/state";
import { calculate, Field, Move, Pokemon, Result } from "../calc";
import { MoveData } from "../services/getdata";

const STAGE_MODIFIERS = {
    '-6': 2/8,
    '-5': 2/7,
    '-4': 2/6,
    '-3': 2/5,
    '-2': 2/4,
    '-1': 2/3,
    '0': 2/2,
    '1': 3/2,
    '2': 4/2,
    '3': 5/2,
    '4': 6/2,
    '5': 7/2,
    '6': 8/2,
}

export class RaidMove {
    boss:           Pokemon;
    raiders:        Pokemon[];
    field:          Field;
    raiderID:       number;
    targetID:       number;
    raiderMoveName: string;
    bossMoveName:   string;

    raiderOptions:  Partial<State.Move>
    bossOptions:    Partial<State.Move>

    //options should include crit, boosts/drops, status effect, min/max damage roll

    raider:         Pokemon;
    raiderMove:     Move;
    bossMove:       Move;

    raiderMoveData: MoveData;
    bossMoveData:   MoveData;

    raiderMovesFirst?: boolean;

    resultingRaiders?: Pokemon[];
    resultingBoss?:    Pokemon;
    resultingField?:   Field;

    raiderDamageResult?: Result;
    bossDamageResult?:   Result;

    constructor(boss: Pokemon, raiders: Pokemon[], field: Field, raiderID: number, targetID: number, 
                raiderMoveName: string, bossMoveName: string, raiderMoveData: MoveData, bossMoveData: MoveData,
                raiderOptions?: Partial<State.Move>, bossOptions?: Partial<State.Move>) {
        this.boss = boss;
        this.raiders = raiders;
        this.field = field;
        this.raiderID = raiderID;
        this.targetID = targetID;
        this.raiderMoveName = raiderMoveName;
        this.bossMoveName = bossMoveName;

        this.raiderOptions = raiderOptions || {};
        this.bossOptions = bossOptions || {};

        this.raider = raiders[raiderID];

        this.raiderMove = new Move(9, this.raiderMoveName, this.raiderOptions);
        this.bossMove = new Move(9, this.bossMoveName, this.bossOptions);

        this.raiderMoveData = raiderMoveData;
        this.bossMoveData = bossMoveData;

        this.resultingRaiders = this.raiders.map((raider) => new Pokemon(9, raider.name, {...raider}));
        this.resultingBoss = new Pokemon(9, this.boss.name, {...this.boss});
        this.resultingField = new Field({...this.field});

        // figure out who goes first
        this.setTurnOrder();
        console.log(this.raiderMovesFirst)
        // execute first move, evaluate additional effects, update hp of target
        if (this.raiderMovesFirst) {
            this.setRaiderDamageResult();
            // this.setRaiderEffects();
        } else {
            this.setBossDamageResult();
            // this.setBossEffects();
        }
        // If the second pokemon to move has not fainted...

        // execute second move, evaluate additional effects, update hp of target
        if (this.raiderMovesFirst) {
            this.setBossDamageResult();
            // this.setBossEffects();
        } else {
            this.setRaiderDamageResult();
            // this.setRaiderEffects();
        }
        console.log(this.raiderDamageResult)
        console.log(this.bossDamageResult)
    }

    setBossDamageResult() {
        const result = calculate(9, this.boss, this.raider, this.bossMove, this.field)
        this.bossDamageResult = result;
    }

    setRaiderDamageResult() {
        const result = calculate(9, this.raider, this.boss, this.raiderMove, this.field)
        this.raiderDamageResult = result;
    }

    setTurnOrder() {
        // first compare priority
        const raiderPriority = this.raiderMove.priority;
        const bossPriority = this.bossMove.priority;
        if (raiderPriority > bossPriority) {
            this.raiderMovesFirst = true;
        } else if (bossPriority < raiderPriority) {
            this.raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            //@ts-ignore
            let raiderSpeed = this.raider.stats.spe * STAGE_MODIFIERS[this.raider.boosts.spe.toString()];
            //@ts-ignore
            let bossSpeed = this.boss.stats.spe * STAGE_MODIFIERS[this.boss.boosts.spe.toString()];
            if (this.field.attackerSide.isTailwind) { raiderSpeed *= 2 };
            if (this.field.defenderSide.isTailwind) { bossSpeed *= 2 };
            this.raiderMovesFirst = this.field.isTrickRoom ? (raiderSpeed > bossSpeed) : (raiderSpeed < bossSpeed);
        }
    }
    
}