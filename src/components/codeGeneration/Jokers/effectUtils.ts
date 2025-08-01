import type { Effect } from "../../ruleBuilder/types";
import type { JokerData } from "../../data/BalatroUtils";
import { coordinateVariableConflicts } from "./variableUtils";
import { generateAddMultReturn } from "./effects/AddMultEffect";
import { generateApplyXMultReturn } from "./effects/ApplyXMultEffect";
import { generateRetriggerReturn } from "./effects/RetriggerEffect";
import { generateDestroySelfReturn } from "./effects/DestroySelfEffect";
import { generateEditHandReturn } from "./effects/EditHandEffect";
import { generateEditDiscardReturn } from "./effects/EditDiscardEffect";
import { generateEditHandSizeReturn } from "./effects/EditHandSizeEffect";
import { generateLevelUpHandReturn } from "./effects/LevelUpHandEffect";
import { generateAddCardToDeckReturn } from "./effects/AddCardToDeckEffect";
import { generateCopyCardToDeckReturn } from "./effects/CopyCardToDeckEffect";
import { generateDeleteCardReturn } from "./effects/DeleteCardEffect";
import { generateEditCardReturn } from "./effects/EditCardEffect";
import { generateModifyInternalVariableReturn } from "./effects/ModifyInternalVariableEffect";
import { generateDestroyConsumableReturn } from "./effects/DestroyConsumableEffect";
import { generateCopyConsumableReturn } from "./effects/CopyConsumableEffect";
import { generateCreateJokerReturn } from "./effects/CreateJokerEffect";
import { generateCopyJokerReturn } from "./effects/CopyJokerEffect";
import { generateDestroyJokerReturn } from "./effects/DestroyJokerEffect";
import { generatePassiveHandSize } from "./effects/EditHandSizeEffect";
import { generatePassiveHand } from "./effects/EditHandEffect";
import { generatePassiveDiscard } from "./effects/EditDiscardEffect";
import { generatePassiveCombineRanks } from "./effects/CombineRanksEffect";
import { generateApplyXChipsReturn } from "./effects/ApplyXChipsEffect";
import { generateCreateTagReturn } from "./effects/CreateTagEffect";
import { generateApplyExpMultReturn } from "./effects/ApplyExpMultEffect";
import { generateApplyExpChipsReturn } from "./effects/ApplyExpChipsEffect";
import { generateShowMessageReturn } from "./effects/ShowMessageEffect";
import { generateSetDollarsReturn } from "./effects/SetDollarsEffect";
import {
  generateDisableBossBlindReturn,
  generatePassiveDisableBossBlind,
} from "./effects/DisableBossBlindEffect";
import { generateSavedReturn } from "./effects/SavedEffect";
import { generateSetSellValueReturn } from "./effects/SetSellValueEffect";
import { generateBalanceReturn } from "./effects/BalanceEffect";
import { generateChangeSuitVariableReturn } from "./effects/ChangeSuitVariableEffect";
import { generateChangeRankVariableReturn } from "./effects/ChangeRankVariableEffect";
import {
  generateFreeRerollsReturn,
  generateDiscountItemsReturn,
} from "./effects/DiscountItemsEffect";
import { generateChangePokerHandVariableReturn } from "./effects/ChangePokerHandVariableEffect";
import { generatePassiveCopyJokerAbility } from "./effects/CopyJokerAbilityEffect";
import { generatePermaBonusReturn } from "./effects/PermaBonusEffect";
import { generateSetAnteReturn } from "./effects/SetAnteEffect";
import { generateAddCardToHandReturn } from "./effects/AddCardToHandEffect";
import { generateCopyCardToHandReturn } from "./effects/CopyCardToHandEffect";
import { generatePassiveSplashEffect } from "./effects/SplashEffect";
import { generatePassiveAllowDebt } from "./effects/AllowDebtEffect";
import { generateReduceFlushStraightRequirementsReturn } from "./effects/ReduceFlushStraightRequirementsEffect";
import { generateShortcutReturn } from "./effects/ShortcutEffect";
import { generateShowmanReturn } from "./effects/ShowmanEffect";
import { generatePassiveCombineSuits } from "./effects/CombineSuitsEffect";
import {
  generateEditConsumableSlotsReturn,
  generatePassiveConsumableSlots,
} from "./effects/EditConsumableSlotsEffect";
import {
  generateEditJokerSlotsReturn,
  generatePassiveJokerSlots,
} from "./effects/EditJokerSlotsEffect";
import { generateAddChipsReturn } from "./effects/AddChipsEffect";
import { generateCreateConsumableReturn } from "./effects/CreateConsumableEffect";
import { generateModifyBlindRequirementReturn } from "./effects/ModifyBlindRequirementEffect";
import { generateBeatCurrentBlindReturn } from "./effects/BeatCurrentBlindEffect";
import { generateFixProbabilityReturn } from "./effects/FixProbabilityEffect";
import { generateModProbabilityReturn } from "./effects/ModProbabilityEffect";
import { generateForceGameOverReturn } from "./effects/ForceGameOverEffect";
import { generateJuiceUpReturn } from "./effects/JuiceUpEffect";

interface ExtendedEffect extends Effect {
  _isInRandomGroup?: boolean;
  _ruleContext?: string;
  _effectIndex?: number;
}

export interface RandomGroup {
  id: string;
  chance_numerator: number;
  chance_denominator: number;
  effects: Effect[];
}

export interface PassiveEffectResult {
  addToDeck?: string;
  removeFromDeck?: string;
  configVariables?: string[];
  locVars?: string[];
  calculateFunction?: string;
  needsHook?: {
    hookType: string;
    jokerKey: string;
    effectParams: unknown;
  };
}

export interface ConfigExtraVariable {
  name: string;
  value: number | string;
  description?: string;
}

export interface EffectReturn {
  statement: string;
  message?: string;
  colour: string;
  configVariables?: ConfigExtraVariable[];
  effectType?: string;
}

export interface ReturnStatementResult {
  statement: string;
  colour: string;
  preReturnCode?: string;
  isRandomChance?: boolean;
  configVariables?: ConfigExtraVariable[];
}

export interface CalculateFunctionResult {
  code: string;
  configVariables: ConfigExtraVariable[];
}

export function generateEffectReturnStatement(
  regularEffects: Effect[] = [],
  randomGroups: RandomGroup[] = [],
  triggerType: string = "hand_played",
  modprefix: string,
  jokerKey?: string,
  ruleId?: string,
  globalEffectCounts?: Map<string, number>
): ReturnStatementResult {
  if (regularEffects.length === 0 && randomGroups.length === 0) {
    return {
      statement: "",
      colour: "G.C.WHITE",
      configVariables: [],
    };
  }

  let combinedPreReturnCode = "";
  let mainReturnStatement = "";
  let primaryColour = "G.C.WHITE";
  const allConfigVariables: ConfigExtraVariable[] = [];

  if (regularEffects.length > 0) {
    const { preReturnCode: regularPreCode, modifiedEffects } =
      coordinateVariableConflicts(regularEffects);

    const effectReturns: EffectReturn[] = modifiedEffects
      .map((effect) => {
        const effectWithContext: ExtendedEffect = {
          ...effect,
          _ruleContext: ruleId,
        };

        const currentCount = globalEffectCounts?.get(effect.type) || 0;
        if (globalEffectCounts) {
          globalEffectCounts.set(effect.type, currentCount + 1);
        }

        const result = generateSingleEffect(
          effectWithContext,
          triggerType,
          currentCount,
          modprefix
        );
        return {
          ...result,
          effectType: effect.type,
        };
      })
      .filter((ret) => ret.statement || ret.message);

    if (regularPreCode) {
      combinedPreReturnCode += regularPreCode;
    }

    effectReturns.forEach((effectReturn) => {
      if (effectReturn.configVariables) {
        allConfigVariables.push(...effectReturn.configVariables);
      }
    });

    const processedEffects: EffectReturn[] = [];
    effectReturns.forEach((effect) => {
      const { cleanedStatement, preReturnCode } = extractPreReturnCode(
        effect.statement
      );

      if (preReturnCode) {
        combinedPreReturnCode +=
          (combinedPreReturnCode ? "\n                " : "") + preReturnCode;
      }

      processedEffects.push({
        ...effect,
        statement: cleanedStatement,
      });
    });

    if (processedEffects.length > 0) {
      mainReturnStatement = buildReturnStatement(processedEffects);
      primaryColour = processedEffects[0]?.colour ?? "G.C.WHITE";
    }
  }

  if (randomGroups.length > 0) {
    const randomGroupStatements: string[] = [];

    const denominators = [
      ...new Set(randomGroups.map((group) => group.chance_denominator)),
    ];
    const denominatorToOddsVar: Record<number, string> = {};

    if (denominators.length === 1) {
      denominatorToOddsVar[denominators[0]] = "card.ability.extra.odds";
      allConfigVariables.push({
        name: "odds",
        value: denominators[0],
        description: "Probability denominator",
      });
    } else {
      denominators.forEach((denom, index) => {
        if (index === 0) {
          denominatorToOddsVar[denom] = "card.ability.extra.odds";
          allConfigVariables.push({
            name: "odds",
            value: denom,
            description: "First probability denominator",
          });
        } else {
          denominatorToOddsVar[denom] = `card.ability.extra.odds${index + 1}`;
          allConfigVariables.push({
            name: `odds${index + 1}`,
            value: denom,
            description: `${index + 1}${getOrdinalSuffix(
              index + 1
            )} probability denominator`,
          });
        }
      });
    }

    randomGroups.forEach((group, groupIndex) => {
      const { preReturnCode: groupPreCode, modifiedEffects } =
        coordinateVariableConflicts(group.effects);

      const effectReturns: EffectReturn[] = modifiedEffects
        .map((effect) => {
          const effectWithContext: ExtendedEffect = {
            ...effect,
            _ruleContext: ruleId,
            _isInRandomGroup: true,
          };

          const currentCount = globalEffectCounts?.get(effect.type) || 0;
          if (globalEffectCounts) {
            globalEffectCounts.set(effect.type, currentCount + 1);
          }

          const result = generateSingleEffect(
            effectWithContext,
            triggerType,
            currentCount,
            modprefix
          );
          return {
            ...result,
            effectType: effect.type,
          };
        })
        .filter((ret) => ret.statement || ret.message);

      effectReturns.forEach((effectReturn) => {
        if (effectReturn.configVariables) {
          allConfigVariables.push(...effectReturn.configVariables);
        }
      });

      if (effectReturns.length === 0) return;

      let groupPreReturnCode = groupPreCode || "";
      const processedEffects: EffectReturn[] = [];

      effectReturns.forEach((effect) => {
        const { cleanedStatement, preReturnCode } = extractPreReturnCode(
          effect.statement
        );

        if (preReturnCode) {
          groupPreReturnCode +=
            (groupPreReturnCode ? "\n                        " : "") +
            preReturnCode;
        }

        processedEffects.push({
          ...effect,
          statement: cleanedStatement,
        });
      });

      const oddsVar = denominatorToOddsVar[group.chance_denominator];
      const probabilityIdentifier = `group_${groupIndex}_${group.id.substring(
        0,
        8
      )}`;

      let groupContent = "";

      const hasDeleteInGroup = group.effects.some(
        (effect) => effect.type === "delete_triggered_card"
      );

      if (
        hasDeleteInGroup &&
        (triggerType === "card_scored" ||
          triggerType === "card_held_in_hand" ||
          triggerType === "card_held_in_hand_end_of_round")
      ) {
        groupContent += `context.other_card.should_destroy = true
                        `;
      }

      if (groupPreReturnCode && groupPreReturnCode.trim()) {
        groupContent += `${groupPreReturnCode}
                        `;
      }

      const isRetriggerEffect = (effect: EffectReturn): boolean => {
        return (
          effect.effectType === "retrigger_cards" ||
          (effect.statement
            ? effect.statement.includes("repetitions") ||
              effect.statement.includes("repetition")
            : false)
        );
      };

      const retriggerEffects = processedEffects.filter(isRetriggerEffect);
      const nonRetriggerEffects = processedEffects.filter(
        (effect) => !isRetriggerEffect(effect)
      );
      const hasFixProbablityEffects = processedEffects.some(
        (effect) => effect.effectType === "fix_probability"
      );
      const hasModProbablityEffects = processedEffects.some(
        (effect) => effect.effectType === "mod_probability"
      );

      if (retriggerEffects.length > 0) {
        const retriggerStatements = retriggerEffects
          .filter((effect) => effect.statement && effect.statement.trim())
          .map((effect) => effect.statement);

        if (retriggerStatements.length > 0) {
          const returnObj = `{${retriggerStatements.join(", ")}}`;
          groupContent += `return ${returnObj}
                        `;
        }
      }

      const effectCalls: string[] = [];
      nonRetriggerEffects.forEach((effect) => {
        if (effect.statement && effect.statement.trim()) {
          const effectObj = `{${effect.statement}}`;
          effectCalls.push(`SMODS.calculate_effect(${effectObj}, card)`);
        }
        if (effect.message) {
          effectCalls.push(
            `card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${
              effect.message
            }, colour = ${effect.colour || "G.C.WHITE"}})`
          );
        }
      });

      if (effectCalls.length > 0) {
        groupContent += effectCalls.join("\n                        ");
      }

      const groupStatement =
        hasFixProbablityEffects || hasModProbablityEffects // prevents stack overflow
          ? `if pseudorandom('${probabilityIdentifier}') < ${group.chance_numerator} / ${oddsVar} then
                        ${groupContent}
                    end`
          : `if SMODS.pseudorandom_probability(card, '${probabilityIdentifier}', ${group.chance_numerator}, ${oddsVar}, 'j_${modprefix}_${jokerKey}') then
                      ${groupContent}
                  end`;
      randomGroupStatements.push(groupStatement);
    });

    if (mainReturnStatement && randomGroupStatements.length > 0) {
      const randomGroupCode = randomGroupStatements.join(
        "\n                    "
      );
      const funcStatement = `func = function()
                        ${randomGroupCode}
                        return true
                    end`;

      if (
        mainReturnStatement.includes("return {") &&
        mainReturnStatement.includes("}")
      ) {
        const insertIndex = mainReturnStatement.lastIndexOf("}");
        mainReturnStatement =
          mainReturnStatement.slice(0, insertIndex) +
          `,
                    ${funcStatement}
                ${mainReturnStatement.slice(insertIndex)}`;
      }
    } else if (!mainReturnStatement && randomGroupStatements.length > 0) {
      mainReturnStatement = randomGroupStatements.join("\n                ");
      if (randomGroups.length > 0 && randomGroups[0].effects.length > 0) {
        const firstEffect = randomGroups[0].effects[0];
        const firstEffectResult = generateSingleEffect(
          firstEffect,
          triggerType,
          0,
          modprefix
        );
        primaryColour = firstEffectResult.colour || "G.C.WHITE";
      }
    }
  }

  return {
    statement: mainReturnStatement,
    colour: primaryColour,
    preReturnCode: combinedPreReturnCode || undefined,
    isRandomChance: randomGroups.length > 0,
    configVariables: allConfigVariables,
  };
}

const generateSingleEffect = (
  effect: ExtendedEffect,
  triggerType: string,
  sameTypeCount: number = 0,
  modprefix: string
): EffectReturn => {
  switch (effect.type) {
    case "add_chips":
      return generateAddChipsReturn(effect, sameTypeCount);
    case "add_mult":
      return generateAddMultReturn(effect, sameTypeCount);
    case "apply_x_mult":
      return generateApplyXMultReturn(effect, sameTypeCount);
    case "retrigger_cards":
      return generateRetriggerReturn(effect, sameTypeCount);
    case "destroy_self":
      return generateDestroySelfReturn(effect);
    case "edit_hand":
      return generateEditHandReturn(effect, sameTypeCount);
    case "edit_discard":
      return generateEditDiscardReturn(effect, sameTypeCount);
    case "edit_hand_size":
      return generateEditHandSizeReturn(effect, sameTypeCount);
    case "level_up_hand":
      return generateLevelUpHandReturn(triggerType, effect, sameTypeCount);
    case "add_card_to_deck":
      return generateAddCardToDeckReturn(effect, triggerType);
    case "copy_triggered_card":
      return generateCopyCardToDeckReturn(effect, triggerType);
    case "copy_played_card":
      return generateCopyCardToDeckReturn(effect, triggerType);
    case "delete_triggered_card":
      return generateDeleteCardReturn(effect, triggerType);
    case "edit_triggered_card":
      return generateEditCardReturn(effect, triggerType);
    case "modify_internal_variable":
      return generateModifyInternalVariableReturn(effect, triggerType);
    case "destroy_consumable":
      return generateDestroyConsumableReturn(effect, triggerType);
    case "copy_consumable":
      return generateCopyConsumableReturn(effect, triggerType);
    case "create_joker":
      return generateCreateJokerReturn(effect, triggerType, modprefix);
    case "copy_joker":
      return generateCopyJokerReturn(effect, triggerType);
    case "destroy_joker":
      return generateDestroyJokerReturn(effect, triggerType);
    case "apply_x_chips":
      return generateApplyXChipsReturn(effect, sameTypeCount);
    case "create_tag":
      return generateCreateTagReturn(effect, triggerType);
    case "apply_exp_mult":
      return generateApplyExpMultReturn(effect, sameTypeCount);
    case "apply_exp_chips":
      return generateApplyExpChipsReturn(effect, sameTypeCount);
    case "show_message":
      return generateShowMessageReturn(effect);
    case "set_dollars":
      return generateSetDollarsReturn(effect, sameTypeCount);
    case "disable_boss_blind":
      return generateDisableBossBlindReturn(effect, triggerType);
    case "prevent_game_over":
      return generateSavedReturn(effect);
    case "set_sell_value":
      return generateSetSellValueReturn(effect, triggerType, sameTypeCount);
    case "balance":
      return generateBalanceReturn(effect);
    case "change_suit_variable":
      return generateChangeSuitVariableReturn(effect);
    case "change_rank_variable":
      return generateChangeRankVariableReturn(effect);
    case "change_pokerhand_variable":
      return generateChangePokerHandVariableReturn(effect);
    case "permanent_bonus":
      return generatePermaBonusReturn(effect, sameTypeCount);
    case "set_ante":
      return generateSetAnteReturn(effect, triggerType, sameTypeCount);
    case "add_card_to_hand":
      return generateAddCardToHandReturn(effect, triggerType);
    case "copy_triggered_card_to_hand":
      return generateCopyCardToHandReturn(effect, triggerType);
    case "copy_played_card_to_hand":
      return generateCopyCardToHandReturn(effect, triggerType);
    case "edit_consumable_slots":
      return generateEditConsumableSlotsReturn(effect, sameTypeCount);
    case "edit_joker_slots":
      return generateEditJokerSlotsReturn(effect, sameTypeCount);
    case "create_consumable":
      return generateCreateConsumableReturn(effect, triggerType);
    case "modify_blind_requirement":
      return generateModifyBlindRequirementReturn(effect, sameTypeCount);
    case "beat_current_blind":
      return generateBeatCurrentBlindReturn(effect);
    case "fix_probability":
      return generateFixProbabilityReturn(effect, sameTypeCount);
    case "mod_probability":
      return generateModProbabilityReturn(effect, sameTypeCount);
    case "force_game_over":
      return generateForceGameOverReturn(effect);
    case "juice_up_joker":
      return generateJuiceUpReturn(effect, sameTypeCount, "joker");
    case "juice_up_card":
      return generateJuiceUpReturn(effect, sameTypeCount, "card");
    default:
      return {
        statement: "",
        colour: "G.C.WHITE",
      };
  }
};

const buildReturnStatement = (effects: EffectReturn[]): string => {
  if (effects.length === 0) return "";

  let firstContentEffectIndex = -1;
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    if (effect.statement.trim().length > 0 || effect.message) {
      firstContentEffectIndex = i;
      break;
    }
  }

  if (firstContentEffectIndex === -1) {
    return "";
  }

  const firstContentEffect = effects[firstContentEffectIndex];
  const hasFirstStatement = firstContentEffect.statement.trim().length > 0;

  let returnStatement = "";

  if (hasFirstStatement) {
    returnStatement = `return {
                    ${firstContentEffect.statement}`;

    if (firstContentEffect.message) {
      returnStatement += `,
                    message = ${firstContentEffect.message}`;
    }
  } else if (firstContentEffect.message) {
    returnStatement = `return {
                    message = ${firstContentEffect.message}`;
  }

  const remainingEffects = effects.slice(firstContentEffectIndex + 1);
  if (remainingEffects.length > 0) {
    let extraChain = "";
    let extraCount = 0;

    for (let i = 0; i < remainingEffects.length; i++) {
      const effect = remainingEffects[i];
      const hasStatement = effect.statement.trim().length > 0;

      let extraContent = "";
      if (hasStatement) {
        extraContent = effect.statement;
        if (effect.message) {
          extraContent += `,
                            message = ${effect.message}`;
        }
      } else if (effect.message) {
        extraContent = `message = ${effect.message}`;
      }

      if (!extraContent) continue;

      if (extraCount === 0) {
        extraChain = `,
                    extra = {
                        ${extraContent}`;

        if (effect.colour && effect.colour.trim()) {
          extraChain += `,
                        colour = ${effect.colour}`;
        }
      } else {
        extraChain += `,
                        extra = {
                            ${extraContent}`;

        if (effect.colour && effect.colour.trim()) {
          extraChain += `,
                            colour = ${effect.colour}`;
        }
      }
      extraCount++;
    }

    for (let i = 0; i < extraCount; i++) {
      extraChain += `
                        }`;
    }

    returnStatement += extraChain;
  }

  returnStatement += `
                }`;

  return returnStatement;
};

export const processPassiveEffects = (
  joker: JokerData
): PassiveEffectResult[] => {
  const passiveEffects: PassiveEffectResult[] = [];

  if (!joker.rules) return passiveEffects;

  joker.rules
    .filter((rule) => rule.trigger === "passive")
    .forEach((rule) => {
      rule.effects?.forEach((effect) => {
        let passiveResult: PassiveEffectResult | null = null;

        const jokerKey = joker.jokerKey;

        switch (effect.type) {
          case "edit_hand_size":
            passiveResult = generatePassiveHandSize(effect);
            break;
          case "edit_hand":
            passiveResult = generatePassiveHand(effect);
            break;
          case "edit_discard":
            passiveResult = generatePassiveDiscard(effect);
            break;
          case "combine_ranks": {
            passiveResult = generatePassiveCombineRanks(effect, jokerKey);
            break;
          }
          case "combine_suits": {
            passiveResult = generatePassiveCombineSuits(effect, jokerKey);
            break;
          }
          case "disable_boss_blind": {
            passiveResult = generatePassiveDisableBossBlind(effect);
            break;
          }
          case "free_rerolls": {
            passiveResult = generateFreeRerollsReturn(effect);
            break;
          }
          case "discount_items": {
            passiveResult = generateDiscountItemsReturn(effect, jokerKey);
            break;
          }
          case "copy_joker_ability": {
            passiveResult = generatePassiveCopyJokerAbility(effect);
            break;
          }
          case "splash_effect": {
            passiveResult = generatePassiveSplashEffect();
            break;
          }
          case "allow_debt": {
            passiveResult = generatePassiveAllowDebt(effect);
            break;
          }
          case "reduce_flush_straight_requirements": {
            passiveResult = generateReduceFlushStraightRequirementsReturn(
              effect,
              jokerKey
            );
            break;
          }
          case "shortcut": {
            passiveResult = generateShortcutReturn(jokerKey);
            break;
          }
          case "showman": {
            passiveResult = generateShowmanReturn(jokerKey);
            break;
          }
          case "edit_consumable_slots": {
            passiveResult = generatePassiveConsumableSlots(effect);
            break;
          }
          case "edit_joker_slots": {
            passiveResult = generatePassiveJokerSlots(effect);
            break;
          }
        }
        if (passiveResult) {
          passiveEffects.push(passiveResult);
        }
      });
    });

  return passiveEffects;
};

function extractPreReturnCode(statement: string): {
  cleanedStatement: string;
  preReturnCode?: string;
} {
  const preReturnStart = "__PRE_RETURN_CODE__";
  const preReturnEnd = "__PRE_RETURN_CODE_END__";

  if (statement.includes(preReturnStart) && statement.includes(preReturnEnd)) {
    const startIndex =
      statement.indexOf(preReturnStart) + preReturnStart.length;
    const endIndex = statement.indexOf(preReturnEnd);

    if (startIndex < endIndex) {
      const preReturnCode = statement.substring(startIndex, endIndex).trim();
      const cleanedStatement = statement
        .replace(
          new RegExp(`${preReturnStart}[\\s\\S]*?${preReturnEnd}`, "g"),
          ""
        )
        .trim();

      return { cleanedStatement, preReturnCode };
    }
  }

  return { cleanedStatement: statement };
}

function getOrdinalSuffix(num: number): string {
  if (num === 2) return "nd";
  if (num === 3) return "rd";
  return "th";
}
