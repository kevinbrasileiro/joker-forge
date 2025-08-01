import type { Effect } from "../../../ruleBuilder/types";
import type { EffectReturn } from "../effectUtils";

export const generateDestroyRandomJokerReturn = (
  effect: Effect
): EffectReturn => {
  const amount = effect.params?.amount || 1;
  const customMessage = effect.customMessage;

  const destroyJokerCode = `
            __PRE_RETURN_CODE__
            local jokers_to_destroy = {}
            local deletable_jokers = {}
            
            for _, joker in pairs(G.jokers.cards) do
                if joker.ability.set == 'Joker' and not SMODS.is_eternal(joker, card) then
                    deletable_jokers[#deletable_jokers + 1] = joker
                end
            end
            
            if #deletable_jokers > 0 then
                local temp_jokers = {}
                for _, joker in ipairs(deletable_jokers) do 
                    temp_jokers[#temp_jokers + 1] = joker 
                end
                
                pseudoshuffle(temp_jokers, 98765)
                
                for i = 1, math.min(card.ability.extra.destroy_joker_amount, #temp_jokers) do
                    jokers_to_destroy[#jokers_to_destroy + 1] = temp_jokers[i]
                end
            end

            G.E_MANAGER:add_event(Event({
                trigger = 'after',
                delay = 0.4,
                func = function()
                    play_sound('tarot1')
                    used_card:juice_up(0.3, 0.5)
                    return true
                end
            }))

            local _first_dissolve = nil
            G.E_MANAGER:add_event(Event({
                trigger = 'before',
                delay = 0.75,
                func = function()
                    for _, joker in pairs(jokers_to_destroy) do
                        joker:start_dissolve(nil, _first_dissolve)
                        _first_dissolve = true
                    end
                    return true
                end
            }))
            delay(0.6)
            __PRE_RETURN_CODE_END__`;

  const result: EffectReturn = {
    statement: destroyJokerCode,
    colour: "G.C.RED",
    configVariables: [`destroy_joker_amount = ${amount}`],
  };

  if (customMessage) {
    result.message = `"${customMessage}"`;
  }

  return result;
};
