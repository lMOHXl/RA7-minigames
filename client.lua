local active = nil -- promise of the running minigame

local function sendConfig()
    SendNUIMessage({
        action = 'config',
        accent = Config.Accent,
        volume = Config.Volume,
        scale = Config.Scale or false,
        position = Config.Position,
    })
end

RegisterNUICallback('ready', function(_, cb)
    sendConfig()
    cb('ok')
end)

RegisterNUICallback('finish', function(data, cb)
    SetNuiFocus(false, false)
    local p = active
    active = nil
    if p then
        p:resolve(data or {})
    end
    cb('ok')
end)
--- Starts a minigame and blocks until it ends.
--- @param game string  game id (see README) or 'random'
--- @param options table|nil  { difficulty = 'easy'|'normal'|'hard', ... game specific overrides }
--- @return boolean success, string reason
local function Start(game, options)
    if active then
        return false, 'busy'
    end
    local p = promise.new()
    active = p
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'start', game = game, options = options or {} })
    local res = Citizen.Await(p)
    return res.success == true, res.reason
end

--- Callback variant, never blocks the caller.
local function StartCb(game, options, cb)
    CreateThread(function()
        local ok, reason = Start(game, options)
        if cb then cb(ok, reason) end
    end)
end

--- Force-stop the running minigame (counts as a failure).
local function Stop()
    if not active then return end
    SendNUIMessage({ action = 'stop' })
end

local function IsActive()
    return active ~= nil
end

exports('Start', Start)
exports('StartCb', StartCb)
exports('Stop', Stop)
exports('IsActive', IsActive)

-- Event API: TriggerEvent('minigames2:start', 'stack', { difficulty = 'hard' }, function(success) end)
AddEventHandler('minigames2:start', function(game, options, cb)
    StartCb(game, options, cb)
end)

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and active then
        SetNuiFocus(false, false)
    end
end)

if Config.Debug then
    RegisterCommand('minigame2', function(_, args)
        local game = args[1] or 'random'
        local difficulty = args[2] or 'normal'
        local ok, reason = Start(game, { difficulty = difficulty })
        print(('[minigames2] %s (%s) -> %s [%s]'):format(game, difficulty, ok and 'SUCCESS' or 'FAIL', tostring(reason)))
    end, false)

    TriggerEvent('chat:addSuggestion', '/minigame2', 'Test a minigame', {
        { name = 'game', help = 'stack, stopwatch, tracker, whack, laser, digits, match, rings, tiles, defuse, random' },
        { name = 'difficulty', help = 'easy | normal | hard' },
    })
end
CreateThread(function()
    print("^5")
    print("^5╔══════════════════════════════════════════════════╗^0")
    print("^5║                  ^3Ra7-Dev^5                     ║^0")
    print("^5║                                                  ║^0")
    print("^5║              ^7Developer: MOHX^5                 ║^0")
    print("^5║              ^7© 2026 Ra7-Dev^5                  ║^0")
    print("^5║                                                  ║^0")
    print("^5║              ^7All Rights Reserved^5             ║^0")
    print("^5║                                                  ║^0")
    print("^5║          ^3https://discord.gg/Sq8MErX8J          ║^0")
    print("^5║                                                  ║^0")
    print("^5║ ^1Unauthorized copying, modification or resale^5 ║^0")
    print("^5║ ^1of this script is strictly prohibited.^5       ║^0")
    print("^5╚══════════════════════════════════════════════════╝^0")
    print("^0")
end)

