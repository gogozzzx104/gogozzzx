local Motion=require(script.Parent:WaitForChild("Motion"))
local RunService=game:GetService("RunService")
local cars={}
local function add(model)
    if not model:IsA("Model") then return end
    if model:GetAttribute("BlueShiftRoadster")==true then cars[model]=false end
end
for _,m in ipairs(workspace:GetDescendants()) do add(m) end
workspace.DescendantAdded:Connect(function(m)
    add(m)
    if m.Name=="RoadsterBody" and m.Parent then cars[m.Parent]=false end
end)
RunService.PreSimulation:Connect(function(dt)
    for model,state in pairs(cars) do
        if not model:IsDescendantOf(workspace) then cars[model]=nil
        else
            state=state or Motion.new(model);cars[model]=state or false
            if state then Motion.step(state,dt) end
        end
    end
end)
