import type { EffectReturn } from "../effectUtils";
import type { Effect } from "../../../ruleBuilder/types";

const TAROT_CARD_KEYS: Record<string, string> = {
  the_fool: "c_fool",
  the_magician: "c_magician",
  the_high_priestess: "c_high_priestess",
  the_empress: "c_empress",
  the_emperor: "c_emperor",
  the_hierophant: "c_hierophant",
  the_lovers: "c_lovers",
  the_chariot: "c_chariot",
  justice: "c_justice",
  the_hermit: "c_hermit",
  the_wheel_of_fortune: "c_wheel_of_fortune",
  strength: "c_strength",
  the_hanged_man: "c_hanged_man",
  death: "c_death",
  temperance: "c_temperance",
  the_devil: "c_devil",
  the_tower: "c_tower",
  the_star: "c_star",
  the_moon: "c_moon",
  the_sun: "c_sun",
  judgement: "c_judgement",
  the_world: "c_world",
};

const PLANET_CARD_KEYS: Record<string, string> = {
  pluto: "c_pluto",
  mercury: "c_mercury",
  uranus: "c_uranus",
  venus: "c_venus",
  saturn: "c_saturn",
  jupiter: "c_jupiter",
  earth: "c_earth",
  mars: "c_mars",
  neptune: "c_neptune",
  planet_x: "c_planet_x",
  ceres: "c_ceres",
  eris: "c_eris",
};

const SPECTRAL_CARD_KEYS: Record<string, string> = {
  familiar: "c_familiar",
  grim: "c_grim",
  incantation: "c_incantation",
  talisman: "c_talisman",
  aura: "c_aura",
  wraith: "c_wraith",
  sigil: "c_sigil",
  ouija: "c_ouija",
  ectoplasm: "c_ectoplasm",
  immolate: "c_immolate",
  ankh: "c_ankh",
  deja_vu: "c_deja_vu",
  hex: "c_hex",
  trance: "c_trance",
  medium: "c_medium",
  cryptid: "c_cryptid",
  the_soul: "c_soul",
  black_hole: "c_black_hole",
};

export const generateDestroyConsumableReturn = (
  effect: Effect,
  triggerType: string
): EffectReturn => {
  const consumableType = (effect.params?.consumable_type as string) || "random";
  const specificCard = (effect.params?.specific_card as string) || "random";
  const customMessage = effect.customMessage;

  const scoringTriggers = ["hand_played", "card_scored"];
  const isScoring = scoringTriggers.includes(triggerType);

  let destroyCode = "";

  if (consumableType === "random") {
    const messageText = customMessage
      ? `"${customMessage}"`
      : `"Destroyed Consumable!"`;
    destroyCode = `
            local target_cards = {}
            for i, consumable in ipairs(G.consumeables.cards) do
                table.insert(target_cards, consumable)
            end
            if #target_cards > 0 then
                local card_to_destroy = pseudorandom_element(target_cards, pseudoseed('destroy_consumable'))
                G.E_MANAGER:add_event(Event({
                    func = function()
                        card_to_destroy:start_dissolve()
                        return true
                    end
                }))
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${messageText}, colour = G.C.RED})
            end`;
  } else {
    let cardKeys: string[] = [];
    let setName = "";

    if (consumableType === "tarot") {
      setName = "Tarot";
      if (specificCard === "random") {
        cardKeys = Object.values(TAROT_CARD_KEYS);
      } else {
        cardKeys = [TAROT_CARD_KEYS[specificCard] || "c_fool"];
      }
    } else if (consumableType === "planet") {
      setName = "Planet";
      if (specificCard === "random") {
        cardKeys = Object.values(PLANET_CARD_KEYS);
      } else {
        cardKeys = [PLANET_CARD_KEYS[specificCard] || "c_pluto"];
      }
    } else if (consumableType === "spectral") {
      setName = "Spectral";
      if (specificCard === "random") {
        cardKeys = Object.values(SPECTRAL_CARD_KEYS);
      } else {
        cardKeys = [SPECTRAL_CARD_KEYS[specificCard] || "c_familiar"];
      }
    }

    const messageText = customMessage
      ? `"${customMessage}"`
      : `"Destroyed Consumable!"`;

    if (specificCard === "random") {
      destroyCode = `
            local target_cards = {}
            for i, consumable in ipairs(G.consumeables.cards) do
                if consumable.ability.set == "${setName}" then
                    table.insert(target_cards, consumable)
                end
            end
            if #target_cards > 0 then
                local card_to_destroy = pseudorandom_element(target_cards, pseudoseed('destroy_consumable'))
                G.E_MANAGER:add_event(Event({
                    func = function()
                        card_to_destroy:start_dissolve()
                        return true
                    end
                }))
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${messageText}, colour = G.C.RED})
            end`;
    } else {
      const targetKey = cardKeys[0];
      destroyCode = `
            local target_cards = {}
            for i, consumable in ipairs(G.consumeables.cards) do
                if consumable.ability.set == "${setName}" and consumable.config.center.key == "${targetKey}" then
                    table.insert(target_cards, consumable)
                end
            end
            if #target_cards > 0 then
                local card_to_destroy = pseudorandom_element(target_cards, pseudoseed('destroy_consumable'))
                G.E_MANAGER:add_event(Event({
                    func = function()
                        card_to_destroy:start_dissolve()
                        return true
                    end
                }))
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${messageText}, colour = G.C.RED})
            end`;
    }
  }

  if (isScoring) {
    return {
      statement: `__PRE_RETURN_CODE__${destroyCode}
                __PRE_RETURN_CODE_END__`,
      colour: "G.C.RED",
    };
  } else {
    return {
      statement: `func = function()${destroyCode}
                    return true
                end`,
      colour: "G.C.RED",
    };
  }
};
