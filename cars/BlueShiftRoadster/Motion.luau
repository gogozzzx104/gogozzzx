-- One independent visual state per observer and car. No physics or speed changes.
local Motion={}
local function ease(t) t=math.clamp(t,0,1);return t*t*(3-2*t) end
function Motion.new(model)
    local body=model:FindFirstChild("RoadsterBody")
    local rig=body and body:FindFirstChild("BoosterRig")
    if not rig then return nil end
    local self={model=model,rig=rig,alpha=0,glow=0,age=0,last="Closed",motors={},fx={}}
    for _,m in ipairs(rig:GetChildren()) do if m:IsA("Motor6D") then self.motors[m.Name]={m=m,base=m.C0} end end
    for _,p in ipairs(model:GetDescendants()) do
        if (p:IsA("Beam") or p:IsA("ParticleEmitter") or p:IsA("PointLight")) and (p.Name:match("^Full") or p.Name:match("^Mini")) then
            table.insert(self.fx,{p=p,full=p.Name:match("^Full")~=nil,width=p:IsA("Beam") and p.Width0 or nil})
        end
    end
    return self
end
function Motion.step(self,dt,override)
    dt=math.min(math.max(dt,0),.1)
    local mode=override or self.model:GetAttribute("RoadsterMode") or "Closed"
    local full=mode=="Full";local mini=mode=="Mini"
    self.age=mode~=self.last and 0 or self.age+dt
    local target=full and 1 or 0
    local rate=full and 1/.56 or 1/.72
    self.alpha=math.clamp(self.alpha+math.clamp(target-self.alpha,-rate*dt,rate*dt),0,1)
    local door=ease(self.alpha)
    local lift=ease((self.alpha-.28)/.72)
    local scale=self.model:GetAttribute("KartScale") or 1
    local offsets={
        DoorLeft=CFrame.Angles(0,0,math.rad(72)*door),
        DoorRight=CFrame.Angles(0,0,-math.rad(72)*door),
        TurbineLift=CFrame.new(0,.92*scale*lift,.52*scale*lift),
        WingLift=CFrame.new(0,.72*scale*door,.12*scale*door)*CFrame.Angles(math.rad(-11)*door,0,0),
    }
    for name,e in pairs(self.motors) do if e.m.Parent then e.m.C0=e.base*offsets[name] end end
    -- Thrust becomes visible only after the covers clear the turbine.
    local ignition=full and ease((self.alpha-.80)/.20) or 0
    self.glow=self.glow+(ignition-self.glow)*(1-math.exp(-dt*(full and 18 or 25)))
    if self.glow<.003 then self.glow=0 end
    for _,e in ipairs(self.fx) do
        local p=e.p
        if p.Parent then
            local active=e.full and self.glow>.01 or not e.full and mini
            p.Enabled=active
            if p:IsA("Beam") then
                local power=e.full and self.glow or (.7+.3*math.sin(self.age*28)^2)
                p.Width0=e.width*power
            elseif p:IsA("PointLight") then p.Brightness=e.full and 2.2*self.glow or .6
            elseif p:IsA("ParticleEmitter") then
                if not e.full and mini and self.last~="Mini" then p:Emit(4) end
                if not active then p:Clear() end
            end
        end
    end
    self.last=mode
end
return Motion
